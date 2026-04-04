## 1. GPIO 简介

GPIO（General-purpose input/output），即通用输入输出接口 。它的引脚可以由开发者通过程序自由控制，根据实际需求，可作为通用输入（GPI）、通用输出（GPO）或通用输入与输出（GPIO）使用 。



## 2. GPIO 的 8 种工作模式

**输入模式：**



- 模拟输入（GPIO_Mode_AIN）

  

- 浮空输入（GPIO_Mode_IN_FLOATING）

  

- 下拉输入（GPIO_Mode_IPD）

  

- 上拉输入（GPIO_Mode_IPU）

  

**输出模式：**



- 开漏输出（GPIO_Mode_Out_OD）

  

- 推挽输出（GPIO_Mode_Out_PP）

  

- 复用开漏输出（GPIO_Mode_AF_OD）

  

- 复用推挽输出（GPIO_Mode_AF_PP）

  

## 3. 引脚模式



- **上拉/下拉输入**：常用于检测外部信号，例如按键检测 。



- **浮空输入**：由于输入阻抗较大，一般用于标准通信协议（如 USART）的接收端 。



- **普通推挽输出**：应用在输出电平为 0 和 3.3V 的场合，可以直接输出高、低电平来驱动数字器件 。推挽结构由两个三极管（或 MOSFET）受两互补信号控制，每次只有一个导通 。其特点是损耗小、效率高，既可以向负载灌电流，也可以从负载抽取电流，提高了电路的负载能力和开关速度 。



- **普通开漏输出**：一般应用在电平不匹配的场合 。芯片内部只能输出低电平（MOS 管漏极直接接地），若需要输出 5V 的高电平，则需要外接 5V 电源及上拉电阻 。当 I/O 设置为高阻态时，由外部电源通过上拉电阻输出 5V 电平 。



- **复用模式**：根据片上外设的功能来选择 。例如引脚用作串口 (USART/SPI/CAN) 的发送端时，使用**复用推挽输出** ；如果用于 I2C、SMBUS 等需要“线与”功能的总线，则使用**复用开漏输出**（需配合上拉电阻） 。

  

## 4. CubeMX 相关配置

### (1) 选择引脚

- **GPIO_Input**：输入引脚 

  

  

- **GPIO_Output**：输出引脚 

  

  

### (2) 配置引脚

**输入引脚配置：**

主要配置 `GPIO Pull-up/Pull-down`（上下拉）：

- **Pull-up (上拉)**：将不确定的信号通过电阻钳位在高电平 。如果你希望引脚平时处于高电平，用于检测低电平（如按键按下接地），应选择上拉 。

  

  

- **Pull-down (下拉)**：将引脚电压拉低至 GND 。如果你希望引脚平时处于低电平，用于检测高电平，应选择下拉 。

  

  

**输出引脚配置：**

- **GPIO output level**：初始化输出电平（High / Low） 。

  

  

- **GPIO mode**：输出模式（开漏或推挽） 。

  

  

- **GPIO Pull-up/Pull-down**：上拉或下拉配置 。

  

  

- **Maximum output speed (最大输出速度)**：可选 Low (2MHz)、Medium (10MHz) 或 High (50MHz) 。

  

  

  

  *理解*：这个速度指的是 **I/O 口驱动电路的响应速度**（边沿陡峭程度），而不是输出信号的翻转频率 。

  

  

  *配置建议*：合理选择速度可以达到最佳的噪声控制并降低功耗 。高频驱动电路噪声较大，若无需高频输出，建议选用低频驱动以提升系统的 EMI 性能 。反之，如果输出高频信号却选了低频驱动，可能导致波形失真 。

  

  

  *举例说明*：

  **USART 串口**：若波特率为 115.2k，选择 2M (Low) 速度即可，省电且噪声小 。

  

  **I2C 接口**：若使用 400k 速率，可选用 10M (Medium) 速度留出余量 。

  

  **SPI 接口**：若使用 9M 或 18M 速率，则需要选用 50M (High) 的引脚速度 。

  

### (3) 代码 (HAL 库)


```C
// 初始化引脚
void HAL_GPIO_Init(GPIO_TypeDef  *GPIOx, GPIO_InitTypeDef *GPIO_Init); 

// 重置（反初始化）引脚
void HAL_GPIO_DeInit(GPIO_TypeDef  *GPIOx, uint32_t GPIO_Pin); 

// 读取引脚电平状态
GPIO_PinState HAL_GPIO_ReadPin(GPIO_TypeDef *GPIOx, uint16_t GPIO_Pin); 

// 设置引脚状态
void HAL_GPIO_WritePin(GPIO_TypeDef *GPIOx, uint16_t GPIO_Pin, GPIO_PinState PinState); 

// 翻转引脚电平状态
void HAL_GPIO_TogglePin(GPIO_TypeDef *GPIOx, uint16_t GPIO_Pin);

// 锁定引脚配置
HAL_StatusTypeDef HAL_GPIO_LockPin(GPIO_TypeDef *GPIOx, uint16_t GPIO_Pin);
```



注：HAL 库预定义了 `GPIO_PIN_RESET` (代表低电平 0) 与 `GPIO_PIN_SET` (代表高电平 1) 。



### (4) User Label 

对于任意引脚，CubeMX 中都有 `User Label` 选项 。这是一个好用的功能：填写标签后，CubeMX 会在 `main.h` 中自动为你生成对应的宏定义（`#define`）。 在 HAL 库编程中，由于 `main.h` 会被各个业务模块调用，这些宏定义具备全局作用域，能提升代码的可读性和后续移植的便利性 。