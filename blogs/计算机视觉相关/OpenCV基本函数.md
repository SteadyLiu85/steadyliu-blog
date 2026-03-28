本篇不涉及深度学习推理等内容

------

### 一、图像读写与窗口操作 

将图像载入内存、展示并保存结果。

**1. `cv2.imread(filename, flags)`**

- **作用**：从指定路径读取图像。
- **常用参数**：`flags` 决定图像的读取方式（`cv2.IMREAD_COLOR` 彩色, `cv2.IMREAD_GRAYSCALE` 灰度, `cv2.IMREAD_UNCHANGED` 包含透明通道）。

**2. `cv2.imshow(winname, mat)`**

- **作用**：在指定名称的窗口中显示图像。

**3. `cv2.waitKey(delay)`**

- **作用**：等待键盘事件。`delay` 为毫秒，如果为 0 则无限期等待。

**4. `cv2.destroyAllWindows()`**

- **作用**：销毁所有OpenCV创建的HighGUI窗口，释放内存。

**5. `cv2.imwrite(filename, img)`**

- **作用**：将图像矩阵（ndarray）保存到本地磁盘。

**示例：**

```python
import cv2

# 1. 读取图像 (以彩色模式和灰度模式分别读取)
img_color = cv2.imread('sample.jpg', cv2.IMREAD_COLOR)
img_gray = cv2.imread('sample.jpg', cv2.IMREAD_GRAYSCALE)

if img_color is not None:
    # 2. 显示图像
    cv2.imshow('Color Image', img_color)
    cv2.imshow('Grayscale Image', img_gray)
    
    # 3 & 4. 等待用户按键，按下任意键后关闭窗口
    print("请在弹出的图像窗口上按任意键继续...")
    cv2.waitKey(0) 
    cv2.destroyAllWindows()
    
    # 5. 保存灰度图像到本地
    cv2.imwrite('sample_gray_saved.jpg', img_gray)
    print("灰度图像已保存！")
else:
    print("未找到图像，请确保当前目录下有 sample.jpg")
```

------

### 二、色彩空间与几何变换

对图像进行缩放、翻转或转换色彩空间。

**6. `cv2.cvtColor(src, code)`**

- **作用**：转换图像的色彩空间。最常用的是 BGR 转 Gray 或 BGR 转 HSV。

**7. `cv2.resize(src, dsize, fx, fy, interpolation)`**

- **作用**：调整图像尺寸。可以通过目标尺寸 `dsize` 缩放，也可以通过比例因子 `fx`, `fy` 缩放。

**8. `cv2.flip(src, flipCode)`**

- **作用**：翻转图像。`0` 表示垂直翻转（沿X轴），`1` 表示水平翻转（沿Y轴），`-1` 表示同时水平和垂直翻转。

**9. `cv2.getRotationMatrix2D(center, angle, scale)`**

- **作用**：计算二维旋转的仿射变换矩阵，常用于配合 `warpAffine` 使用。

**10. `cv2.warpAffine(src, M, dsize)`**

- **作用**：对图像应用仿射变换（平移、旋转、倾斜等）。`M` 是一个 $2 \times 3$ 的变换矩阵。

**示例：**

```python
import cv2
import numpy as np

img = cv2.imread('sample.jpg')

if img is not None:
    # 6. 色彩空间转换 (BGR -> HSV，常用于颜色识别)
    img_hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # 7. 图像缩放 (将图像缩小到原来的 0.5 倍)
    img_resized = cv2.resize(img, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_LINEAR)
    
    # 8. 图像翻转 (水平翻转)
    img_flipped = cv2.flip(img, 1)
    
    # 9 & 10. 图像旋转 (以中心点旋转45度，缩放比例1.0)
    h, w = img.shape[:2]
    center = (w // 2, h // 2)
    rotation_matrix = cv2.getRotationMatrix2D(center, angle=45, scale=1.0)
    img_rotated = cv2.warpAffine(img, rotation_matrix, (w, h))

    # 展示其中一个结果
    cv2.imshow('Rotated Image', img_rotated)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
```

------

### 三、图像平滑与降噪

图像在获取过程中容易产生噪声，滤波函数可以在保留图像特征的同时去除噪声。

**11. `cv2.blur(src, ksize)`**

- **作用**：均值滤波。使用特定大小的归一化卷积框模糊图像。

**12. `cv2.GaussianBlur(src, ksize, sigmaX)`**

- **作用**：高斯滤波。相较于均值滤波，它对中心像素赋予更高权重，能更自然地平滑图像并去除高斯噪声。`ksize` 必须是奇数（如 `(5, 5)`）。

**13. `cv2.medianBlur(src, ksize)`**

- **作用**：中值滤波。用核内像素的中值代替中心像素。

**14. `cv2.bilateralFilter(src, d, sigmaColor, sigmaSpace)`**

- **作用**：双边滤波。一种高级的滤波器，它可以在**保持边缘清晰**的同时去除噪声。

**15. `cv2.filter2D(src, ddepth, kernel)`**

- **作用**：自定义二维卷积滤波。可以自己定义一个矩阵（核）。

**示例：**

```python
import cv2
import numpy as np

img = cv2.imread('sample.jpg')

if img is not None:
    # 11. 均值滤波 (核大小 5x5)
    img_blur = cv2.blur(img, (5, 5))
    
    # 12. 高斯滤波 (核大小 5x5，sigmaX自动计算)
    img_gaussian = cv2.GaussianBlur(img, (5, 5), 0)
    
    # 13. 中值滤波 (核大小为5)
    img_median = cv2.medianBlur(img, 5)
    
    # 14. 双边滤波 (邻域直径9，颜色空间标准差75，坐标空间标准差75)
    img_bilateral = cv2.bilateralFilter(img, 9, 75, 75)
    
    # 15. 自定义滤波 (实现一个简单的图像锐化核)
    kernel_sharpening = np.array([[-1, -1, -1], 
                                  [-1,  9, -1], 
                                  [-1, -1, -1]])
    # ddepth=-1 表示输出图像与输入图像具有相同的深度
    img_sharpened = cv2.filter2D(img, -1, kernel_sharpening)

    # 对比显示原图和锐化后的图
    cv2.imshow('Original', img)
    cv2.imshow('Sharpened', img_sharpened)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
```

------

### 四、形态学操作

处理二值化（黑白）图像，消除噪声、分割独立元素或连接相邻元素。

**16. `cv2.getStructuringElement(shape, ksize)`**

- **作用**：生成形态学操作所需的结构元素（核/Kernel）。支持矩形 (`MORPH_RECT`)、十字形 (`MORPH_CROSS`) 和椭圆形 (`MORPH_ELLIPSE`)。

**17. `cv2.erode(src, kernel, iterations)`**

- **作用**：腐蚀操作。让图像中的高亮区域（白色）变瘦，常用于去除细小的白色噪点或分离粘连的物体。

**18. `cv2.dilate(src, kernel, iterations)`**

- **作用**：膨胀操作。让图像中的高亮区域变胖，常用于填补物体内部的细小黑洞或连接断开的线条。

**19. `cv2.morphologyEx(src, op, kernel)`**

- **作用**：高级形态学变换。通过组合腐蚀和膨胀实现：
  - `cv2.MORPH_OPEN` (开运算)：先腐蚀后膨胀，**去除外部噪点**。
  - `cv2.MORPH_CLOSE` (闭运算)：先膨胀后腐蚀，**填充内部孔洞**。
  - `cv2.MORPH_GRADIENT` (形态学梯度)：膨胀图减去腐蚀图，**提取物体轮廓**。

**20. `cv2.threshold(src, thresh, maxval, type)`**

- **作用**：全局固定阈值处理（二值化）。将灰度图转换为黑白图，超过 `thresh` 的像素设为 `maxval`（通常是255）。配合 `cv2.THRESH_OTSU` 可以自动寻找最佳阈值。

**21. `cv2.adaptiveThreshold(src, maxval, adaptiveMethod, thresholdType, blockSize, C)`**

- **作用**：自适应阈值处理。当图像不同区域光照不均匀时，它根据像素的局部邻域块 (`blockSize`) 动态计算阈值，比全局阈值效果更好。

**示例：**

```python
import cv2
import numpy as np

# 读取灰度图
img_gray = cv2.imread('sample.jpg', cv2.IMREAD_GRAYSCALE)

if img_gray is not None:
    # 20. 全局二值化 (Otsu自动阈值)
    ret, thresh_img = cv2.threshold(img_gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # 21. 自适应二值化 (用于光照不均的文本图像)
    adaptive_thresh = cv2.adaptiveThreshold(img_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                            cv2.THRESH_BINARY, 11, 2)

    # 16. 获取结构元素 (5x5 矩形)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    
    # 17 & 18. 腐蚀与膨胀
    eroded = cv2.erode(thresh_img, kernel, iterations=1)
    dilated = cv2.dilate(thresh_img, kernel, iterations=1)
    
    # 19. 开运算 (去噪) 和 闭运算 (填洞)
    opened = cv2.morphologyEx(thresh_img, cv2.MORPH_OPEN, kernel)
    closed = cv2.morphologyEx(thresh_img, cv2.MORPH_CLOSE, kernel)

    cv2.imshow('Adaptive Threshold', adaptive_thresh)
    cv2.imshow('Opened (Noise Removal)', opened)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
```

------

### 第五部分：边缘检测

寻找图像中亮度变化剧烈的点。

**22. `cv2.Canny(image, threshold1, threshold2)`**

- **作用**：Canny 边缘检测算法。这是目前**最常用且效果最好**的边缘检测函数。它通过双阈值机制提取连续的边缘线条。

**23. `cv2.Sobel(src, ddepth, dx, dy, ksize)`**

- **作用**：Sobel 算子。计算图像的亮度梯度，可以分别求 X 方向（垂直边缘）或 Y 方向（水平边缘）的梯度。

**24. `cv2.Scharr(src, ddepth, dx, dy)`**

- **作用**：Scharr 算子。它是 Sobel 的优化版，在核大小为 3x3 时，对微小梯度的捕捉更加敏感和精确。

**25. `cv2.Laplacian(src, ddepth)`**

- **作用**：拉普拉斯算子。计算图像的二阶导数，能够突出图像中急剧变化的区域，常用于**图像清晰度/模糊度评估**。

**示例：**

```python
import cv2
import numpy as np

img = cv2.imread('sample.jpg', cv2.IMREAD_GRAYSCALE)

if img is not None:
    # 22. Canny 边缘检测 (推荐先进行高斯模糊去噪)
    blurred = cv2.GaussianBlur(img, (3, 3), 0)
    canny_edges = cv2.Canny(blurred, 50, 150)
    
    # 23. Sobel 边缘检测 (提取X和Y方向边缘并合并)
    sobel_x = cv2.Sobel(img, cv2.CV_64F, 1, 0, ksize=3)
    sobel_y = cv2.Sobel(img, cv2.CV_64F, 0, 1, ksize=3)
    sobel_x = cv2.convertScaleAbs(sobel_x) # 转回 uint8
    sobel_y = cv2.convertScaleAbs(sobel_y)
    sobel_combined = cv2.addWeighted(sobel_x, 0.5, sobel_y, 0.5, 0)
    
    # 25. Laplacian 边缘检测 (也常用于检测图像是否模糊)
    laplacian = cv2.Laplacian(img, cv2.CV_64F)
    laplacian = cv2.convertScaleAbs(laplacian)

    cv2.imshow('Canny Edges', canny_edges)
    cv2.imshow('Sobel Combined', sobel_combined)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
```

------

### 第六部分：轮廓计算

在得到二值图或边缘图后，需要把白色的相连区域提取出来。

**26. `cv2.findContours(image, mode, method)`**

- **作用**：在二值图像中寻找轮廓。`mode` 决定层级关系（如只提取外轮廓 `RETR_EXTERNAL` 或提取所有轮廓 `RETR_TREE`），`method` 决定点的存储方式（如保留所有点或只保留顶点 `CHAIN_APPROX_SIMPLE`）。

**27. `cv2.drawContours(image, contours, contourIdx, color, thickness)`**

- **作用**：在图像上绘制找到的轮廓。`contourIdx=-1` 表示绘制所有轮廓。

**28. `cv2.contourArea(contour)`**

- **作用**：计算轮廓所包围的面积。常用于过滤掉太小或太大的干扰区域。

**29. `cv2.arcLength(curve, closed)`**

- **作用**：计算轮廓的周长或曲线长度。`closed=True` 表示轮廓是闭合的。

**30. `cv2.boundingRect(array)`**

- **作用**：计算轮廓的直边边界框（外接矩形）。返回 `(x, y, w, h)`，常用于在识别到的目标外面画一个框。

**示例：**

```python
import cv2

# 准备工作：读取、变灰度、二值化
img = cv2.imread('sample.jpg')
img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
ret, thresh = cv2.threshold(img_gray, 127, 255, cv2.THRESH_BINARY)

# 26. 寻找轮廓
# 注意：OpenCV版本不同，返回值数量可能不同 (新版返回2个：contours, hierarchy)
contours, hierarchy = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# 复制原图用于绘制
img_drawn = img.copy()

for contour in contours:
    # 28. 计算面积，过滤掉过小的噪点
    area = cv2.contourArea(contour)
    if area > 500: 
        # 29. 计算周长
        perimeter = cv2.arcLength(contour, True)
        
        # 30. 获取外接矩形
        x, y, w, h = cv2.boundingRect(contour)
        
        # 在原图上画出绿色外接矩形
        cv2.rectangle(img_drawn, (x, y), (x+w, y+h), (0, 255, 0), 2)

# 27. 绘制红色真实轮廓 (contourIdx=-1表示画所有)
cv2.drawContours(img_drawn, contours, -1, (0, 0, 255), 2)

cv2.imshow('Contours and Bounding Boxes', img_drawn)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

------

### 七、直方图与对比度增强

直方图是分析图像像素分布的利器，常用于调整图像对比度、改善光照不均。

**31. `cv2.calcHist(images, channels, mask, histSize, ranges)`**

- **作用**：计算图像的像素直方图，统计不同亮度/颜色级别的像素数量。

**32. `cv2.equalizeHist(src)`**

- **作用**：全局直方图均衡化。用于增强灰度图的全局对比度，让过暗或过亮的图像细节显现出来。

**33. `cv2.createCLAHE(clipLimit, tileGridSize)`**

- **作用**：创建限制对比度自适应直方图均衡化（CLAHE）对象。比全局均衡化效果更好，能避免局部区域过度曝光产生噪点。

**34. `cv2.normalize(src, dst, alpha, beta, norm_type)`**

- **作用**：数组/图像归一化。常将像素值线性拉伸到指定的范围（如 0-255 或 0-1）。

**35. `cv2.inRange(src, lowerb, upperb)`**

- **作用**：颜色阈值过滤。提取在 `lowerb` 和 `upperb` 范围内的像素（常配合 HSV 色彩空间进行特定颜色物体的追踪），输出二值化掩膜 (Mask)。

------

### 八、图像金字塔与按位运算

**36. `cv2.pyrUp(src)`**

- **作用**：图像向上采样（放大）。分辨率变为原来的 2 倍，图像会变得模糊。

**37. `cv2.pyrDown(src)`**

- **作用**：图像向下采样（缩小）。分辨率变为原来的 1/2，常用于构建图像金字塔。

**38. `cv2.bitwise_and(src1, src2, mask)`**

- **作用**：按位与运算。常用于图像的遮罩（Mask）操作，即只保留 Mask 为白色的原图区域。

**39. `cv2.bitwise_not(src)`**

- **作用**：按位取反。黑变白，白变黑。

**40. `cv2.absdiff(src1, src2)`**

- **作用**：计算两幅图像差的绝对值。用于**移动侦测**或**背景减除**。

------

### 九、几何透视与模板匹配

**41. `cv2.getPerspectiveTransform(src, dst)`**

- **作用**：获取透视变换矩阵。需要提供原图的 4 个点和目标图的 4 个点。常用于“文档扫描”时的图像矫正。

**42. `cv2.warpPerspective(src, M, dsize)`**

- **作用**：应用透视变换。

**43. `cv2.matchTemplate(image, templ, method)`**

- **作用**：模板匹配。在大图中寻找与小图（模板）最相似的区域。

**44. `cv2.minMaxLoc(src)`**

- **作用**：寻找矩阵中的全局最大值和最小值及其坐标。常配合 `matchTemplate` 使用，找到匹配度最高的位置。

**45. `cv2.addWeighted(src1, alpha, src2, beta, gamma)`**

- **作用**：图像融合。按一定权重将两张相同大小的图像叠加在一起（如做水印或转场效果）。

---

### 十、摄像头获取

在 OpenCV 中，无论是读取本地视频文件还是调用 USB/内置摄像头，都是统一通过 `VideoCapture` 类来实现的。

1. **`cv2.VideoCapture(index/filename)`**：初始化对象。传入整数索引（如 `0` 代表默认摄像头，`1` 代表外接摄像头）表示调用硬件；传入文件路径（如 `'video.mp4'`）表示读取视频文件。
2. **`cap.isOpened()`**：检查摄像头或视频流是否成功初始化。
3. **`cap.read()`**：按帧抓取视频。返回两个值：布尔值（是否成功读取到帧）和当前帧的图像矩阵（`Mat` / `ndarray`）。
4. **`cap.get(propId)` / `cap.set(propId, value)`**：获取或设置摄像头的硬件参数，如分辨率（`CAP_PROP_FRAME_WIDTH`）、帧率（`CAP_PROP_FPS`）等。
5. **`cap.release()`**：使用完毕后必须释放硬件资源。

#### Python 版本：

```python
import cv2

# 0 表示默认的电脑内置摄像头
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("无法打开摄像头")
    exit()

while True:
    # 逐帧捕获
    ret, frame = cap.read()
    
    # 如果正确读取帧，ret为True
    if not ret:
        print("无法接收帧 (视频流结束？)。退出...")
        break

    # 在这里对 frame 进行处理，例如转为灰度图
    gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # 显示结果帧
    cv2.imshow('Live Camera - Color', frame)
    cv2.imshow('Live Camera - Gray', gray_frame)

    # 等待1毫秒，并检测是否按下了 ESC 键 (ASCII码为27)
    if cv2.waitKey(1) == 27:
        break

# 完成所有操作后，释放捕获器并销毁窗口
cap.release()
cv2.destroyAllWindows()
```

#### C++ 版本：

```C++
#include <opencv2/opencv.hpp>
#include <iostream>

using namespace cv;
using namespace std;

int main() {
    // 0 表示默认的电脑内置摄像头
    VideoCapture cap(0); 

    // 检查是否成功打开
    if (!cap.isOpened()) {
        cout << "无法打开摄像头" << endl;
        return -1;
    }

    Mat frame, gray_frame;
    
    while (true) {
        // 读取新的一帧，可以用 cap.read(frame) 或者 cap >> frame
        cap >> frame;
        
        // 如果读取的帧为空，说明视频结束或摄像头断开连接
        if (frame.empty()) {
            cout << "无法接收帧。退出中..." << endl;
            break;
        }

        // 图像处理逻辑
        cvtColor(frame, gray_frame, COLOR_BGR2GRAY);

        // 显示图像
        imshow("Live Camera - Color", frame);
        imshow("Live Camera - Gray", gray_frame);

        // 等待30毫秒，检测是否按下 ESC 键
        if (waitKey(30) == 27) {
            break;
        }
    }

    // C++ 中 VideoCapture 的析构函数会自动调用 release()，但手动调用是一个好习惯
    cap.release();
    destroyAllWindows();

    return 0;
}
```