3. ## 1. 串口概念

   - **UART**（通用异步收发传输器）：将资料在串行与并行通信间转换，常集成于其他通讯接口 。
   
     
   
   - **USART**（通用同步/异步串行收发器）：全双工模块，比 UART 多了同步功能，接口高度灵活 。
   
     
   
   ## 2. CubeMX 配置
   
   ### 2.1 模式选择 
   
   - **Asynchronous（异步）**：最常用，发送者与接收者时钟独立，互不阻塞 。
   
     
   
   - **Synchronous（同步）**：需同步信号，发送者须等待应答 。
   
     
   
   - **Single Wire（单总线）**：半双工模式 。
   
     
   
   - **Hardware Flow Control (RS232)**：硬件流控。启用 **RTS/CTS** 信号线可有效防止高速传输或长距离噪声环境下的数据丢失 。
   
   ![img](/api/uploads/1775093773331-277598097.png)
   
   当USART外设启用Hardware Flow Control功能时，它会通过两条信号线（RTS和
   CTS）来控制数据的传输。当接收端准备好接收数据时，它会通过CTS信号线告知发送端可以发送数据；当接收端暂时无法接收数据时，它会通过CTS信号线告知发送端停止发送数据，直到接收端再次准备好接收数据。
   
   在STM32的CubeMX中，启用Hardware Flow Control功能可以提高串口通信的可靠性和稳定性，特别是在高速数据传输、长距离传输或噪声干扰环境下，能够有效地防止数据丢失和错误。
   
   
   ### 2.2 配置引脚
   
   通信双方必须匹配以下参数才能正常通讯 ：
   
   
   - **Baud Rate**：波特率。波特率表示每秒钟传送的码元符号的个数，是衡量数据传送速率的指标，它用单位时间内载波调制状态改变的次数来表示。对于串口最重要的就是波特率，常用的波特率为115200与9600。
   
   
   - **Word Length**：数据长度（通常为 8 Bits）。
   
     
   
   - **Parity**：校验位（None/Even/Odd）。
   
     
   
   - **Stop Bits**：停止位（通常为 1）。
   
   ------
   
   ![img](/api/uploads/1775093776395-142721270.png)
   
   ## 3. 三种传输模式
   
   ### 3.1 阻塞模式 (Blocking Mode)
   
   CPU 逐个字节处理数据，完成后才执行后续指令。适用于对实时性要求不高、简单的数据回传 。
   
   
   
   ```C
   // 发送数据，Timeout 为超时时间
   HAL_StatusTypeDef HAL_UART_Transmit(UART_HandleTypeDef *huart, uint8_t *pData, uint16_t Size, uint32_t Timeout);
   // 接收数据
   HAL_StatusTypeDef HAL_UART_Receive(UART_HandleTypeDef *huart, uint8_t *pData, uint16_t Size, uint32_t Timeout);
   ```
   
   
   
   ### 3.2 中断模式 (Interrupt Mode)
   
   通过 NVIC 开启串口全局中断。
   
   ```C
   // 发送中断
	HAL_StatusTypeDef HAL_UART_Transmit_IT(UART_HandleTypeDef *huart, uint8_t*pData, uint16_tSize);
   // 接收中断
   HAL_StatusTypeDef HAL_UART_Receive_IT(UART_HandleTypeDef *huart, uint8_t*pData, uint16_tSize);
   ```
   
   - **开启接收中断：** `HAL_UART_Receive_IT(&huart1, rx_buf, 10);` 
   
     
   
   - **中断回调处理：** 在 `HAL_UART_RxCpltCallback` 中编写逻辑。
   
     ![img](/api/uploads/1775093779668-348283199.png)
     
   - **注意：** 如果采用中断的模式去接收或者发送，需要先开启中断，因为 CubeMX 生成的代码并不会给你开启中断，这点也符合需求，每个人的项目需要在特定的时候开启中断，**并不都是在初始化的时候就开启！**
   
     如果没有特殊需求就把中断开启函数写在初始化函数的用户沙箱里面，并重写中断回
     
     调函数，还再要在回调函数中**重新开启中断**。
     
	  ```C
     void MX_USART1_UART_Init(void)
     {
     / USER CODE BEGIN USART1_Init 2 /
     HAL_UART_Receive_IT(&huart1, uart1_rxbuf, 10);
     / USER CODE END USART1_Init 2 */
     }
     // 定义接收和发送的缓冲区
     uint8_t uart1_rxbuf[10]={0};
     uint8_t uart1_txbuf[10]={0};
     // 重写中断回调函数
     void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart)
     {
          if(huart->Instance==USART1)// 判断是哪个串口触发的中断
          {
          HAL_UART_Transmit(&huart1, uart1_rxbuf, 10, 100); // 把收到的字节原样发送出去
          HAL_UART_Receive_IT(&huart1, uart1_rxbuf, 10);// 重新打开中断
          }
          if(huart->Instance==USART2)// 判断是哪个串口触发的中断
          {
          // 中断逻辑函数部分
          HAL_UART_Receive_IT(&huart1, uart1_rxbuf, 10);
          }
     }
   
   
   
   除了上述的接收中断函数还有其他几个中断函数：
   
   
   
   ```c
   HAL_UART_IRQHandler(UART_HandleTypeDef *huart); // 串口中断处理函数
   HAL_UART_TxCpltCallback(UART_HandleTypeDef *huart); // 串口发送中断回调函数
   HAL_UART_TxHalfCpltCallback(UART_HandleTypeDef *huart);// 串口发送一半中断回调函数（用的较少）
   HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart); // 串口接收中断回调函数
   HAL_UART_RxHalfCpltCallback(UART_HandleTypeDef *huart);// 串口接收一半回调函数（用的较少）
   HAL_UART_ErrorCallback();// 串口接收错误函数
   ```
   
   
   
   
   
   ### 3.3 DMA 模式
   
   降低 CPU 负荷，数据直接在内存与外设间搬运 。只需在中断模式的基础上开始 DMA 传输就行，同样的然后需要在使用前开始 DMA 中断使能。
   
   ```C
   // 使用DMA发送
   HAL_StatusTypeDef HAL_UART_Transmit_IT(UART_HandleTypeDef *huart, uint8_t*pData, uint16_tSize);
   // 使用DMA接收
   HAL_StatusTypeDef HAL_UART_Receive_DMA(UART_HandleTypeDef *huart, uint8_t*pData, uint16_tSize);
   // DMA暂停
   HAL_StatusTypeDef HAL_UART_DMAPause(UART_HandleTypeDef *huart);
   // DMA恢复
   HAL_StatusTypeDef HAL_UART_DMAResume(UART_HandleTypeDef *huart);
   // DMA停止
   HAL_StatusTypeDef HAL_UART_DMAStop(UART_HandleTypeDef *huart);
   ```
   
   - **发送逻辑：** DMA 发送一次完成后不会自动再次发送，通常需要在 `while(1)` 循环中根据业务需求重复调用开启函数 。
   
     ```c
     // 发送提示信息
     uint8_t message1[]="****UART commucition using IDLE IT DMA****\n";
     uint8_t message2[]="Please enter 8 characters: \n";
     HAL_UART_Transmit(&huart1,(uint8_t *)message1,sizeof(message1),HAL_MAX_DELAY);
     HAL_UART_Transmit(&huart1,(uint8_t *)message2,sizeof(message2),HAL_MAX_DELAY);
     // 使能 DMA 接收中断
     HAL_UART_Receive_DMA(&huart1, (uint8_t *)RxBuffer,LENGTH);
     ```
     
     在 while 的内部添加如下代码：
     
     ```c
     while (1)
     {
     HAL_UART_Transmit_DMA(&huart1, (uint8_t *)"hello windows!\n", 15 );
     HAL_Delay(1000); // 延时 1s
         if(RxFlag == 1) // 如果接受完成，不再发送数据
         {
         HAL_UART_Transmit_DMA(&huart1,(uint8_t *)"Recevie Success!\n",17);// 完成
         break; // 退出循环，不再发送数据
         }
     }
     ```
   
   
   
   ![img](/api/uploads/1775093785072-940002507.png)
   
   
   - **回调机制：** DMA 回调与普通中断共用函数，简化了用户接口 。同样需要在回调中手动重新使能 DMA 接收以保持链路畅通 。
   
     ```c
     void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart) // 串口接收中断回调函数
     {
         if(huart->Instance == USART1) // 判断发生接收中断的串口
         {
         RxFlag=1; // 置为接收完成标志
          // DMA 使能接收中断 这个必须添加，否则不能再使用 DMA 进行发送接受
         HAL_UART_Receive_DMA(&huart1, (uint8_t *)RxBuffer,LENGTH);
         }
     }
     ```
     
     至此，串口通信部分已经基本总结完成，下面还有几种利用串口的方式进行调试的方
     
     法。
     
     
     
     
   
   ------
   
   ## 4. 调试系统
   
   ### 4.1 printf 重定向 (MicroLIB 法)
   
   本质是改写 C 库的 `fputc` 函数，在内部调用 HAL 库的阻塞发送函数 。
   
   
   
   - **必要步骤：** 在 Keil 设置中开启 **Use MicroLIB** 选项 。
   
     
   
   ```C
   int fputc(int ch, FILE *f) {
       HAL_UART_Transmit(&huart1, (uint8_t *)&ch, 1, 0xffff);
       return ch;
   }
   ```
   
   ### 4.2  Log 管理
   
   利用 C 语言的宏定义和条件编译（`#ifdef`），可以全局管控 Log 输出，避免正式发布时产生多余的串口开销 。
   
   
   
   - **日志级别：** 定义 `info`、`debug`、`error` 等不同前缀，方便快速定位文件名和错误信息 。
   
     
   
   - **代码示例：**
   
     ```c
     #define USER_MAIN_DEBUG // 定义此宏开启 Log
     #ifdef USER_MAIN_DEBUG
       #define user_main_info(format, ...) printf("[main] info:" format "\r\n", ##__VA_ARGS__)
     #else
       #define user_main_info(format, ...)
     #endif
     ```
   
   ------
   
   ## 5. VOFA+ 数据可视化
   
   当需要调试 PID 参数、观察滤波器效果或 ADC 采集波形时，可用到VOFA+
   
   ### 5.1 通信协议：FireWater
   
   VOFA+ 最常用的协议是 **FireWater**。它接收以逗号分隔的明文浮点数，并以换行符结尾 。
   
   - **下位机发送格式：**
   
     ```C
   // 输出格式：Data:值1,值2,值3\n
   user_main_Vofa("%.3f,%.3f,%.3f", raw_val, filter_val, target_val);
     ```
   
   - **注意：** 串口波特率必须与 VOFA+ 上位机配置严格一致。输出帧必须包含换行符（`\n` 或 `\r\n`），否则上位机无法正确分割数据帧 。
   
     ![img](/api/uploads/1775093790444-360107656.png)
   
   ### 5.2 上位机配置
   
   1. **连接配置**：在“串口调试”模块选择正确的 COM 口，波特率设为 115200（或代码设定值）。
   
      
   
   2. **数据解析**：引擎选择 **FireWater**，软件会自动根据逗号将数据拆分为 Channel 0, Channel 1... 
   
      
   
   3. **波形呈现**：将解析出的通道拖拽至波形图控件，即可实时观察数据动态，进行滤波器性能分析 。