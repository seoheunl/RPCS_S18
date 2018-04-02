#ifndef _ADAFRUIT_BLE_UART_H_
#define _ADAFRUIT_BLE_UART_H_

#include "Arduino.h"
#include <Adafruit_BLE.h>

#define SOFTWARE_SERIAL_AVAILABLE   ( ! (defined (_VARIANT_ARDUINO_DUE_X_) || defined (ARDUINO_ARCH_SAMD) || defined (ARDUINO_STM32_FEATHER)) )

#if SOFTWARE_SERIAL_AVAILABLE
  #include <SoftwareSerial.h>
#endif

class Adafruit_BluefruitLE_UART : public Adafruit_BLE
{
  private:
    // Hardware Pins
    int8_t  _mode_pin, _cts_pin, _rts_pin;
    Stream *mySerial;
#if SOFTWARE_SERIAL_AVAILABLE
    SoftwareSerial *ss;
#endif
    HardwareSerial *hs;
    boolean _debug;
    uint8_t _intercharwritedelay;

  public:
    // Software Serial Constructor (0, 1, 2, or 3 pins)
    Adafruit_BluefruitLE_UART(HardwareSerial &port,
		      int8_t mode_pin = -1, 
		      int8_t cts_pin = -1, 
		      int8_t rts_pin = -1);
#if SOFTWARE_SERIAL_AVAILABLE
    Adafruit_BluefruitLE_UART(SoftwareSerial &port,
		      int8_t mode_pin = -1, 
		      int8_t cts_pin = -1, 
		      int8_t rts_pin = -1);
#endif

    void setInterCharWriteDelay(uint8_t x) { _intercharwritedelay = x; };

    virtual ~Adafruit_BluefruitLE_UART();

    // HW initialisation
    bool begin(boolean debug = false, boolean blocking = true);
    void end(void);

    bool setMode(uint8_t new_mode);

    // Class Print virtual function Interface
    virtual size_t write(uint8_t c);

    // pull in write(str) and write(buf, size) from Print
    using Print::write;

    // Class Stream interface
    virtual int  available(void);
    virtual int  read(void);
    virtual void flush(void);
    virtual int  peek(void);
};

#endif
