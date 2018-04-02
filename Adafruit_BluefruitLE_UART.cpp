#include "Adafruit_BluefruitLE_UART.h"

/******************************************************************************/
/*!
    @brief Instantiates a new instance of the Adafruit_BluefruitLE_UART class
*/
/******************************************************************************/
Adafruit_BluefruitLE_UART::Adafruit_BluefruitLE_UART(HardwareSerial &port, int8_t mode_pin, int8_t cts_pin, int8_t rts_pin) :
  _mode_pin(mode_pin), _cts_pin(cts_pin), _rts_pin(rts_pin)
{
  _physical_transport = BLUEFRUIT_TRANSPORT_HWUART;

#if SOFTWARE_SERIAL_AVAILABLE
  ss = 0;
#endif

  hs = &port;
  mySerial = &port;
}

#if SOFTWARE_SERIAL_AVAILABLE
/******************************************************************************/
/*!
    @brief Instantiates a new instance of the Adafruit_BluefruitLE_UART class
           using software serial
*/
/******************************************************************************/
Adafruit_BluefruitLE_UART::Adafruit_BluefruitLE_UART(SoftwareSerial &port, int8_t mode_pin, int8_t cts_pin, int8_t rts_pin) :
  _mode_pin(mode_pin), _cts_pin(cts_pin), _rts_pin(rts_pin)
{
  _physical_transport = BLUEFRUIT_TRANSPORT_SWUART;

  hs = 0;
  ss = &port;
  mySerial = &port;
}
#endif


/******************************************************************************/
/*!
    @brief Class's Destructor
*/
/******************************************************************************/
Adafruit_BluefruitLE_UART::~Adafruit_BluefruitLE_UART()
{
  end();
}

/******************************************************************************/
/*!
    @brief Initialize the HW to enable communication with the BLE module

    @return Returns 'true' if everything initialised correctly, otherwise
            'false' if there was a problem during HW initialisation. If
            'irqPin' is not a HW interrupt pin false will be returned.
*/
/******************************************************************************/
bool Adafruit_BluefruitLE_UART::begin(boolean debug, boolean blocking)
{
  _verbose = debug;
  _intercharwritedelay = 0;

  // If hardware mode pin is enabled, set it to CMD first
  if ( _mode_pin >= 0)
  {
    pinMode(_mode_pin, OUTPUT);
    digitalWrite(_mode_pin, BLUEFRUIT_MODE_COMMAND);

    // A bit of delay to make sure mode change take effect
    delay(1);
  }

  // Bluefruit baudrate is fixed to 9600
  if (hs) {
    hs->begin(9600);

    #ifdef ARDUINO_STM32_FEATHER
    hs->enableFlowControl();
    #endif
  } else {
#if SOFTWARE_SERIAL_AVAILABLE
    ss->begin(9600);
#endif
  }

  if (_cts_pin > 0) {
    pinMode(_cts_pin, OUTPUT);
    digitalWrite(_cts_pin, HIGH);  // turn off txo
  }
    
  if (_rts_pin > 0) {
    pinMode(_rts_pin, INPUT);
  }

  mySerial->setTimeout(_timeout);
  // reset Bluefruit module upon connect
  return reset(blocking);
}

/******************************************************************************/
/*!
    @brief  Uninitializes the SPI interface
*/
/******************************************************************************/
void Adafruit_BluefruitLE_UART::end(void)
{
  if (hs) {
    hs->end();
  } else {
#if SOFTWARE_SERIAL_AVAILABLE
    ss->end();
#endif
  }
}

/******************************************************************************/
/*!
    @brief  Set the hardware MODE Pin if it is enabled, or performs a SW based
            mode switch if no MODE pin is available (SPI Friend, etc.)

    @param[in]  mode
                The mode to change to, either BLUEFRUIT_MODE_COMMAND or
                BLUEFRUIT_MODE_DATA

    @return     true if the mode switch was successful, otherwise false
*/
/******************************************************************************/
bool Adafruit_BluefruitLE_UART::setMode(uint8_t new_mode)
{
  // invalid mode
  if ( !(new_mode == BLUEFRUIT_MODE_COMMAND || new_mode == BLUEFRUIT_MODE_DATA) ) return false;

  bool isOK;

  if ( _mode_pin >= 0 )
  {
    // Switch mode using hardware pin
    digitalWrite(_mode_pin, new_mode);
    delay(1);
    isOK = true;
  } else
  {
    // Switch mode using +++ command, at worst switch 2 times
    int32_t updated_mode;

    isOK = atcommandIntReply(F("+++"), &updated_mode);

    if ( isOK )
    {
      // Ahhh, we are already in the wanted mode before sending +++
      // Switch again. This is required to make sure it is always correct
      if ( updated_mode != new_mode )
      {
        isOK = atcommandIntReply(F("+++"), &updated_mode);
        // Still does not match -> give up
        if ( updated_mode != new_mode ) return false;
      }
    }
  }

  _mode = new_mode;

  return isOK;
}

/******************************************************************************/
/*!
    @brief  Print API. Either buffer the data internally or send it to bus
            if possible. \r and \n are command terminators and will force the
            packet to be sent to the Bluefruit LE module.

    @param[in]  c
                Character to send
*/
/******************************************************************************/
size_t Adafruit_BluefruitLE_UART::write(uint8_t c)
{
  // flush left-over before a new command
//  if (c == '\r') flush();

  if (_verbose) SerialDebug.print((char) c);

  if (_rts_pin >= 0) {
    while (digitalRead(_rts_pin)) {
      delay(1);
    }
  } else {
    delay(_intercharwritedelay);
  }

  delayMicroseconds(50);
  return mySerial->write(c);
}

/******************************************************************************/
/*!
    @brief Check if the response from the previous command is ready

    @return 'true' if a response is ready, otherwise 'false'
*/
/******************************************************************************/
int Adafruit_BluefruitLE_UART::available(void)
{
  if (!  mySerial->available() & (_cts_pin > 0)) {
    // toggle flow control to get more byteses
    digitalWrite(_cts_pin, LOW);
    delay(1);
    digitalWrite(_cts_pin, HIGH);
  }
  return mySerial->available();
}

/******************************************************************************/
/*!
    @brief Get a byte from response data, perform SPI transaction if needed

    @return -1 if no data is available
*/
/******************************************************************************/
int Adafruit_BluefruitLE_UART::read(void)
{
  int c = mySerial->read();
  return c;
}

/******************************************************************************/
/*!
    @brief Get a byte from response without removing it, perform SPI transaction
           if needed

    @return -1 if no data is available
*/
/******************************************************************************/
int Adafruit_BluefruitLE_UART::peek(void)
{
  return mySerial->peek();
}

/******************************************************************************/
/*!
    @brief Flush current response data in the internal FIFO

    @return -1 if no data is available
*/
/******************************************************************************/
void Adafruit_BluefruitLE_UART::flush(void)
{
  mySerial->flush();
}
