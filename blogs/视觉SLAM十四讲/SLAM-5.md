本篇的内容总结自《视觉SLAM十四讲》的第九、十章

## 一、BA 的数学建模 

在第九讲中，BA 被建模为一个庞大的**非线性最小二乘问题**。不同于 PnP 只优化位姿，BA 追求的是相机位姿 $T$ 和地图点 $P$ 的**联合优化**。

### 1. 状态向量的定义

假设我们有 $m$ 个相机位姿 $T_1, \dots, T_m$，以及 $n$ 个三维地图点 $P_1, \dots, P_n$。

我们要优化的总变量为：

$$x = [T_1, \dots, T_m, p_1, \dots, p_n]^T$$

### 2. 代价函数：重投影误差 (Reprojection Error)

对于每一个观测到的点，其误差项定义为像素观测值 $z_{ij}$ 与模型预测值 $h(T_i, p_j)$ 的差：

$$e_{ij} = z_{ij} - \frac{1}{Z_{p'}} K (T_i p_j)$$

BA 的目标函数即为所有观测误差的平方和：

$$\min_{x} \frac{1}{2} \sum_{i=1}^{m} \sum_{j=1}^{n} \| z_{ij} - h(T_i, p_j) \|_W^2$$

> **光束法平差（Bundle Adjustment）的物理投影模型：**

------

## 二、雅可比矩阵 (Jacobian) 

为了使用高斯-牛顿法求解，我们需要对误差函数求偏导。在 BA 中，雅可比矩阵 $J$ 具有非常特殊的块结构。

对于一个特定的残差项 $e_{ij}$，它只与第 $i$ 个相机位姿和第 $j$ 个地图点有关：

$$J_{ij} = \frac{\partial e_{ij}}{\partial x} = [0, \dots, 0, \frac{\partial e_{ij}}{\partial \delta \xi_i}, 0, \dots, 0, \frac{\partial e_{ij}}{\partial p_j}, 0, \dots, 0]$$

- **相机导数 $F_{ij}$**：维度为 $2 \times 6$，利用李代数扰动模型推导。
- **空间点导数 $E_{ij}$**：维度为 $2 \times 3$，利用链式法则对三维坐标求导。

这种大量的“0”意味着雅可比矩阵是极其**稀疏**的。正是这种稀疏性，决定了后续计算 H 矩阵的独特形状。

------

## 三、H 矩阵的稀疏性

在迭代过程中，我们需要求解增量方程 $H \Delta x = g$，其中 $H = J^T J$。

由于位姿和路标点之间只有“观测”这一层联系，H 矩阵呈现出一种经典的**“箭头”分布**（或称块对角分布）：

$$H = \begin{bmatrix} B & E \\ E^T & C \end{bmatrix}$$

- **$B$ 矩阵**：由位姿对位姿的偏导组成，是由 $m$ 个 $6 \times 6$ 矩阵构成的对角块矩阵。
- **$C$ 矩阵**：由地图点对地图点的偏导组成，是由 $n$ 个 $3 \times 3$ 矩阵构成的对角块矩阵。
- **$E$ 矩阵**：连接位姿与地图点的观测项。

> **BA 中 Hessian 矩阵的稀疏模式示意（块状对角结构）：**

这种结构预示着我们不需要直接对这个数万维的巨大矩阵求逆，而是可以利用分块消元来实现加速。

------

## 四、Schur 补与边缘化 (Marginalization) 

由于地图点 $n$ 的数量远大于相机位姿 $m$ 的数量，直接求解 $H \Delta x = g$ 会面临巨大的内存开销。

利用 **Schur 补（Schur Complement）**，我们可以先消去地图点，先解位姿增量：

1. **分块方程组**：

   $$\begin{bmatrix} B & E \\ E^T & C \end{bmatrix} \begin{bmatrix} \Delta x_c \\ \Delta x_p \end{bmatrix} = \begin{bmatrix} v \\ w \end{bmatrix}$$

2. **消元过程**：

   利用 $C$ 是对角矩阵、求逆极其简单的特性，通过高斯消元得到关于位姿 $\Delta x_c$ 的简化方程：

   $$(B - E C^{-1} E^T) \Delta x_c = v - E C^{-1} w$$

这一步在 SLAM 中被称为**边缘化 (Marginalization)**。我们成功地将一个包含数万个变量的超级大坑，缩小到了只与相机位姿相关的 $6m \times 6m$ 维度的方程。解到位姿 $\Delta x_c$ 后，再代回求解地图点 $\Delta x_p$。

**这就是 BA 能在实时 SLAM（如 ORB-SLAM）中运行的底层秘籍。**

------

## 五、 Ceres/g2o

在您的 C++ 工程实践中，通常不需要手动实现 Schur 补的消元细节，成熟的优化库已经为我们封装好了这些极客操作。

### 1. g2o (图优化)

在 g2o 中，BA 被定义为一个**图 (Graph)**：

- **顶点 (Vertex)**：相机位姿节点、三维路标点节点。
- **边 (Edge)**：连接位姿和路标点的重投影误差（Binary Edge）。
- **设置线性求解器**：必须设置为 `LinearSolverSparseSchur` 才能利用稀疏性加速。

### 2. Ceres Solver (通用非线性优化)

Ceres 通过 `CostFunction` 和 `Problem` 来构建优化。对于 BA 问题，Ceres 允许我们指定 `LinearSolverType` 为 `SPARSE_SCHUR`。

Ceres 的自动求导（Auto-Diff）功能极大地降低了雅可比矩阵推导的难度，但在追求极致性能时，手动编写分析求导（Analytic Derivatives）仍是最佳选择。

---

## 六、从 BA 到位姿图 (Pose Graph)

### 1. 为什么要抛弃地图点？

在 BA 的全量优化中，状态向量包含了 $[T_1, \dots, T_m, P_1, \dots, P_n]$。但从纯粹的“定位”需求来看，我们真正关心的其实只有机器人的轨迹 $T$。

无数的三维地图点 $P$ 仅仅是为了给 $T$ 的计算提供几何约束。既然如此，当系统运行到后期，我们能否**把地图点全部丢弃，只保留相机位姿之间的约束关系**？

### 2. 位姿图 (Pose Graph) 的数学定义

答案是肯定的。这在数学上被称为**边缘化 (Marginalization)** 的一种极致宏观体现。

我们构建一张图：

- **顶点 (Vertices)**：代表相机在各个时刻的绝对位姿 $T_1, T_2, \dots, T_n$。
- **边 (Edges)**：代表两个位姿之间的**相对运动约束 $\Delta T_{ij}$**。

这个相对运动约束是怎么来的？

它可能是前端视觉里程计（VO）计算出的相邻两帧的运动，也可能是回环检测（Loop Closure）模块发现的相隔很远的两帧之间的运动。

这种只优化位姿 $T$、彻底抛弃空间点 $P$ 的图优化模型，就是 **位姿图 (Pose Graph)**。它的维度极低，优化速度极快，是目前所有主流 SLAM 系统（如 ORB-SLAM, VINS-Mono）处理全局回环检测时的绝对标配。

> **位姿图（Pose Graph）的拓扑结构示意（节点为位姿，边为相对观测）：**
>
> [https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Graph_SLAM.svg/800px-Graph_SLAM.svg.png](https://www.google.com/search?q=https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Graph_SLAM.svg/800px-Graph_SLAM.svg.png)

------

## 七、位姿图优化的数学抽象

既然要优化，就必须定义误差。在 BA 中，误差是二维像素平面的“重投影误差”。但在位姿图中，没有了像素，也没有了三维点，我们的误差是什么？

### 1. 相对位姿误差的定义

假设在理想状态下，相机从节点 $i$ 运动到节点 $j$，其真实的绝对位姿是 $T_i$ 和 $T_j$。那么从 $i$ 到 $j$ 的真实相对运动就应该是：

$$T_{ij} = T_i^{-1} T_j$$

但在实际系统中，前端 VO 或回环检测会给出一个包含噪声的**传感器测量值 $\tilde{T}_{ij}$**。

我们的目标，就是让优化变量 $T_i$ 和 $T_j$ 计算出来的相对运动，尽可能地逼近测量值 $\tilde{T}_{ij}$。

如果两者完全一致，那么 $\tilde{T}_{ij}^{-1} (T_i^{-1} T_j) = I$（单位阵）。

因此，我们可以非常自然地定义出**位姿误差矩阵 $E_{ij}$**：

$$E_{ij} = \tilde{T}_{ij}^{-1} T_i^{-1} T_j$$

### 2. 映射到李代数空间

误差矩阵 $E_{ij}$ 是一个 $SE(3)$ 群上的变换矩阵，我们无法直接对其求平方和。必须利用对数映射（Logarithm Map），将其强行拉扯到平坦的李代数 $\mathfrak{se}(3)$ 向量空间中：

$$e_{ij} = \ln( \tilde{T}_{ij}^{-1} T_i^{-1} T_j )^{\vee}$$

此时，$e_{ij}$ 变成了一个 $6 \times 1$ 的普通列向量。位姿图的终极目标函数，就是最小化所有边的误差向量的马哈拉诺比斯距离（Mahalanobis Distance，引入了信息矩阵 $\Omega_{ij}$ 来衡量不同边的置信度）：

$$\min_{T} \frac{1}{2} \sum_{i,j \in \mathcal{E}} e_{ij}^T \Omega_{ij} e_{ij}$$

------

## 八、 位姿图的李代数雅可比

有了非线性目标函数，下一步就是为了使用高斯-牛顿法（Gauss-Newton）或 LM 算法而求解雅可比矩阵（Jacobian）。

由于误差项 $e_{ij}$ 同时连接了顶点 $T_i$ 和 $T_j$，我们需要分别对它们求偏导。

### 1. 对 $T_i$ 进行左扰动求导

给 $T_i$ 施加一个微小的李代数左扰动 $\delta \xi_i$。此时 $T_i$ 变为 $\exp(\delta \xi_i^{\wedge}) T_i$。

将扰动代入误差公式：

$$\hat{e}_{ij} = \ln( \tilde{T}_{ij}^{-1} (\exp(\delta \xi_i^{\wedge}) T_i)^{-1} T_j )^{\vee}$$

$$= \ln( \tilde{T}_{ij}^{-1} T_i^{-1} \exp(-\delta \xi_i^{\wedge}) T_j )^{\vee}$$

注意看！扰动项 $\exp(-\delta \xi_i^{\wedge})$ 被夹在了公式的中间，而我们希望把它剥离出来。这里必须动用李群数学中最顶级的武器：**BCH 公式（Baker-Campbell-Hausdorff）的近似展开**，以及**伴随性质 (Adjoint Property)**。

利用伴随性质 $\exp(\xi^{\wedge}) T = T \exp((Ad(T^{-1}) \xi)^{\wedge})$ 将扰动项移到最右侧，并利用一阶泰勒展开，经过极其繁杂的化简（十四讲中的推导堪称艺术），我们可以得到误差关于 $T_i$ 的雅可比矩阵：

$$J_i = \frac{\partial e_{ij}}{\partial \delta \xi_i} = - \mathcal{J}_r^{-1}(e_{ij}) \text{Ad}(T_j^{-1} T_i)$$

*(注：$\mathcal{J}_r^{-1}$ 是李代数的右雅可比矩阵的逆，$\text{Ad}$ 是伴随矩阵。)*

### 2. 对 $T_j$ 进行左扰动求导

同理，给 $T_j$ 施加左扰动 $\delta \xi_j$：

$$\hat{e}_{ij} = \ln( \tilde{T}_{ij}^{-1} T_i^{-1} \exp(\delta \xi_j^{\wedge}) T_j )^{\vee}$$

经过类似的 BCH 近似，对 $T_j$ 的偏导数异常简洁：

$$J_j = \frac{\partial e_{ij}}{\partial \delta \xi_j} = \mathcal{J}_r^{-1}(e_{ij})$$

### 3. 工程上的极致近似

在 C++ 工程落地（如在 g2o 中编写自定义的 Edge）时，严格计算右雅可比 $\mathcal{J}_r^{-1}(e_{ij})$ 极其消耗算力。

由于在优化收敛时，误差 $e_{ij}$ 应当趋近于 0。当李代数极其微小时，右雅可比矩阵近似等于单位阵 $I$。

因此，工业界通常采用一阶近似：

$$J_i \approx - \text{Ad}(T_j^{-1} T_i)$$

$$J_j \approx I$$

这几行优美的导数公式，就是所有位姿图优化底层求解器的算力核心！

------

## 九、鲁棒核函数 (Robust Kernel)

在讲完了 PGO 的数学引擎后，我们必须面对一个极度现实的工程灾难：**错误回环 (False Loop Closure)**。

### 1. 问题

位姿图的边 $\tilde{T}_{ij}$ 高度依赖回环检测（如 DBoW3 词袋模型）。但如果机器人走在长得一模一样的两条不同走廊里，回环检测大概率会发生误判，强行把两个相距甚远的节点用一条边连起来。

在基于最小二乘法的图优化中，由于误差是**平方项** ($e^2$)，一个巨大的错误边会产生极大的梯度，瞬间将原本正常的轨迹彻底拉扯至崩溃、扭曲。在 SLAM 中，一条错误回环足以毁掉几个小时的建图成果。

### 2. 鲁棒核函数 (Robust Kernel Function) 的降维打击

既然平方项对大误差极其敏感（呈抛物线爆炸），我们能不能修改误差函数，让它在误差较小时保持平滑的二次方，而在误差过大（被怀疑是外点/错误回环）时，增长变得极其缓慢？

这就是**鲁棒核函数 $\rho(e)$**。我们将原本的二次代价函数替换为：

$$\min_{T} \sum \rho(e_{ij}^T \Omega_{ij} e_{ij})$$

**最经典的 Huber 核函数**：

Huber Loss 设定了一个阈值 $\delta$：

- 当误差 $|e| \le \delta$ 时，$\rho(e) = \frac{1}{2} e^2$ （保持二次函数的快速收敛特性）。
- 当误差 $|e| > \delta$ 时，$\rho(e) = \delta (|e| - \frac{1}{2} \delta)$ （**退化为一次线性函数**，死死压制住大误差的梯度爆炸）。

> **Huber 核函数（绿色）与传统平方误差（蓝色）的增长曲线对比：**
>
> [https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Huber_loss.svg/600px-Huber_loss.svg.png](https://www.google.com/search?q=https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Huber_loss.svg/600px-Huber_loss.svg.png)

在 Ceres 或 g2o 等 C++ 优化库中，调用 Huber 或 Cauchy 核函数往往只需要一行代码：

C++

```
// Ceres 中极其简练的核函数调用
ceres::LossFunction* loss_function = new ceres::HuberLoss(1.0);
problem.AddResidualBlock(cost_function, loss_function, ...);
```

正是这极其简单的一行代码，赋予了现代 SLAM 系统在复杂真实环境中抵挡外点干扰的强大生命力。



