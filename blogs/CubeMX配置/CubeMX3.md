## 外部中断 (EXTI)

外部中断是单片机实时地处理外部事件的一种内部机制 。当某种外部事件发生时，单片机的中断系统将迫使 CPU 暂停正在执行的程序，转而去进行中断事件的处理；中断处理完毕后，又返回被中断的程序处，继续执行下去 。

### CubeMX 相关配置

#### (1) 初始化引脚

如果你想使用 PA1 作为外部中断的接收引脚，那么你只需要点击 PA1，再点击它对应的 `GPIO_EXTI1` 。

![img](/api/uploads/1775196802485-424487561.png)

#### (2) 使能中断

需要在 NVIC Settings 中勾选对应的 EXTI line 中断使能。
![img](/api/uploads/1775196806040-281416353.png)

#### (3) 配置引脚

这个地方与普通 GPIO 不同的地方在于 `GPIO mode` ：



- **External Interrupt Mode with Rising edge trigger detection**：上升沿触发外部中断 。


- **External Interrupt Mode with Falling edge trigger detection**：下降沿触发外部中断 。
  

- **External Interrupt Mode with Rising/Falling edge trigger detection**：上升沿或下降沿触发外部中断 。 *(注：还可以配置为 Event 事件触发模式，如上升沿、下降沿或双边沿触发外部事件)* 。

![img](/api/uploads/1775196811369-335853272.png)

  

#### (4) 编写逻辑代码

在 `stm32f4xx_it.c` 内添加外部中断的回调函数 。这个回调函数非常便利的地方在于，当同时有多个中断使能的时候，STM32CubeMX 会自动地将几个中断的服务函数规整到一起并调用同一个回调函数 。也就是说无论几个中断，我们只需要重写一个回调函数并判断传进来的端口号即可 。




```C
void HAL_GPIO_EXTI_Callback(uint16_t GPIO_Pin)
{
    if(GPIO_Pin == key_up_Pin)
    {
        if(HAL_GPIO_ReadPin(key_up_GPIO_Port, key_up_Pin) == 1)
        {
            HAL_GPIO_TogglePin(LED_R_GPIO_Port, LED_R_Pin);
            HAL_GPIO_WritePin(Beep_GPIO_Port, Beep_Pin, GPIO_PIN_SET);
            while(HAL_GPIO_ReadPin(key_up_GPIO_Port, key_up_Pin) == 1);
            HAL_GPIO_WritePin(Beep_GPIO_Port, Beep_Pin, GPIO_PIN_RESET);
        }
    }
}
```


在 STM32 中有很多中断线，可以看出 PA0、PB0...PG0 共用的 EXTI0 中断线，PA1、PB1...PG1 共用的 EXTI1 中断线，对应 16 个中断线 。



1. **同一 pin 口不可同时配置外部中断**（例如 PA0 和 PB0 不能同时配置）。


2. **不同 pin 口可以同时配置外部中断**（例如 PA0 和 PA1 可以同时配置）。
   
3. **共用中断服务函数（handler 句柄函数）**，以中断标志位区分 。

4. 外部中断的本质是某中断线得到信号触发，进入对应的中断服务函数的过程 。

5. 某一路中断线只能同时跟一个 pin 口搭上 。


**STM32 分组和对应中断处理函数分配表：** 
![img](/api/uploads/1775196818094-586480206.png)


中断线 0-4 每个中断线对应一个中断函数，中断线 5-9 共用中断函数** EXTI9_5_IRQHandler**，中断线 10-15 共用中断函数 **EXTI15_10_IRQHandler**




```C
// CubeMX 默认生成的中断服务函数（以 10-15 为例）
void EXTI15_10_IRQHandler(void)
{
    /* USER CODE BEGIN EXTI15_10_IRQn 0 */
    /* USER CODE END EXTI15_10_IRQn 0 */
    HAL_GPIO_EXTI_IRQHandler(GPIO_PIN_10);
    HAL_GPIO_EXTI_IRQHandler(GPIO_PIN_11);
    HAL_GPIO_EXTI_IRQHandler(GPIO_PIN_12);
    HAL_GPIO_EXTI_IRQHandler(GPIO_PIN_13);
    HAL_GPIO_EXTI_IRQHandler(GPIO_PIN_14);
    HAL_GPIO_EXTI_IRQHandler(GPIO_PIN_15);
    /* USER CODE BEGIN EXTI15_10_IRQn 1 */
    /* USER CODE END EXTI15_10_IRQn 1 */
}
```

对于使用公用中断服务函数的中断线，需要先判断是那根中断线发生中断，然后**直接在中断线服务函数中编写逻辑代码**，不用在回调函数中编写，这就需要修改 CubeMX 生成的代码 ：

```C
// 修改后的中断服务函数
void EXTI15_10_IRQHandler(void)
{
    if(GPIO_Pin == GPIO_PIN_10)
    {
        // 逻辑函数
        HAL_GPIO_WritePin(BEEP_GPIO_Port, BEEP_Pin, GPIO_PIN_SET);
        HAL_Delay(SOFT_DELAY);
        HAL_GPIO_WritePin(BEEP_GPIO_Port, BEEP_Pin, GPIO_PIN_RESET);
        // 最后一定要清除中断标志位
        HAL_GPIO_EXTI_IRQHandler(GPIO_PIN_10);
    }
    
    if(GPIO_Pin == GPIO_PIN_11)
    {
        HAL_GPIO_WritePin(BEEP_GPIO_Port, BEEP_Pin, GPIO_PIN_SET);
        HAL_Delay(SOFT_DELAY);
        HAL_GPIO_WritePin(BEEP_GPIO_Port, BEEP_Pin, GPIO_PIN_RESET);
        HAL_GPIO_EXTI_IRQHandler(GPIO_PIN_11);
    }
}
```

从此处就可以看出 HAL 库的封装逻辑：当发生中断的时候先调用中断线处理函数（如 **EXTI15_10_IRQHandler**），然后进入外部中断处理函数（**HAL_GPIO_EXTI_IRQHandler**），最后统一调用回调函数（**HAL_GPIO_EXTI_Callback**）。