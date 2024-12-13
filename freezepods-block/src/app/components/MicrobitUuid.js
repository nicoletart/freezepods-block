
export const MicrobitUuid = {
  genericAccess: ["00001800-0000-1000-8000-00805f9b34fb", "Generic Access"],
  genericAttribute: [
    "00001801-0000-1000-8000-00805f9b34fb",
    "Generic Attribute",
  ],
  deviceInformation: [
    "0000180a-0000-1000-8000-00805f9b34fb",
    "Device Information",
  ],
  accelerometerService: [
    "e95d0753-251d-470a-a062-fa1922dfa9a8",
    "Accelerometer Service",
  ],
  magnetometerService: [
    "e95df2d8-251d-470a-a062-fa1922dfa9a8",
    "Magnetometer Service",
  ],
  buttonService: ["e95d9882-251d-470a-a062-fa1922dfa9a8", "Button Service"],
  ioPinService: ["e95d127b-251d-470a-a062-fa1922dfa9a8", "IO Pin Service"],
  ledService: ["e95dd91d-251d-470a-a062-fa1922dfa9a8", "LED Service"],
  eventService: ["e95d93af-251d-470a-a062-fa1922dfa9a8", "Event Service"],
  dfuControlService: [
    "e95d93b0-251d-470a-a062-fa1922dfa9a8",
    "DFU Control Service",
  ],
  temperatureService: [
    "e95d6100-251d-470a-a062-fa1922dfa9a8",
    "Temperature Service",
  ],
  uartService: ["6e400001-b5a3-f393-e0a9-e50e24dcca9e", "UART Service"],

  /**
   * Characteristics
   */
  deviceName: ["00002a00-0000-1000-8000-00805f9b34fb", "Device Name"],
  appearance: ["00002a01-0000-1000-8000-00805f9b34fb", "Appearance"],
  modelNumberString: [
    "00002a24-0000-1000-8000-00805f9b34fb",
    "Model Number String",
  ],
  serialNumberString: [
    "00002a25-0000-1000-8000-00805f9b34fb",
    "Serial Number String",
  ],
  hardwareRevisionString: [
    "00002a27-0000-1000-8000-00805f9b34fb",
    "Hardware Revision String",
  ],
  firmwareRevisionString: [
    "00002a26-0000-1000-8000-00805f9b34fb",
    "Firmware Revision String",
  ],
  manufacturerNameString: [
    "00002a29-0000-1000-8000-00805f9b34fb",
    "Manufacturer Name String",
  ],
  accelerometerData: [
    "e95dca4b-251d-470a-a062-fa1922dfa9a8",
    "Accelerometer Data",
  ],
  accelerometerPeriod: [
    "e95dfb24-251d-470a-a062-fa1922dfa9a8",
    "Accelerometer Period",
  ],
  magnetometerData: [
    "e95dfb11-251d-470a-a062-fa1922dfa9a8",
    "Magnetometer Data",
  ],
  magnetometerPeriod: [
    "e95d386c-251d-470a-a062-fa1922dfa9a8",
    "Magnetometer Period",
  ],
  magnetometerBearing: [
    "e95d9715-251d-470a-a062-fa1922dfa9a8",
    "Magnetometer Bearing",
  ],
  magnetometerCalibration: [
    "e95db358-251d-470a-a062-fa1922dfa9a8",
    "Magnetometer Calibration",
  ],
  buttonAState: ["e95dda90-251d-470a-a062-fa1922dfa9a8", "Button A State"],
  buttonBState: ["e95dda91-251d-470a-a062-fa1922dfa9a8", "Button B State"],
  pinData: ["e95d8d00-251d-470a-a062-fa1922dfa9a8", "Pin Data"],
  pinADConfiguration: [
    "e95d5899-251d-470a-a062-fa1922dfa9a8",
    "Pin AD Configuration",
  ],
  pinIOConfiguration: [
    "e95db9fe-251d-470a-a062-fa1922dfa9a8",
    "Pin IO Configuration",
  ],
  pwmControl: ["e95dd822-251d-470a-a062-fa1922dfa9a8", "PWM Control"],
  ledMatrixState: ["e95d7b77-251d-470a-a062-fa1922dfa9a8", "LED Matrix State"],
  ledText: ["e95d93ee-251d-470a-a062-fa1922dfa9a8", "LED Text"],
  scrollingDelay: ["e95d0d2d-251d-470a-a062-fa1922dfa9a8", "Scrolling Delay"],
  microbitRequirements: [
    "e95db84c-251d-470a-a062-fa1922dfa9a8",
    "MicroBit Requirements",
  ],
  microbitEvent: ["e95d9775-251d-470a-a062-fa1922dfa9a8", "MicroBit Event"],
  clientRequirements: [
    "e95d23c4-251d-470a-a062-fa1922dfa9a8",
    "Client Requirements",
  ],
  clientEvent: ["e95d5404-251d-470a-a062-fa1922dfa9a8", "Client Event"],
  dfuControl: ["e95d93b1-251d-470a-a062-fa1922dfa9a8", "DFU Control"],
  temperature: ["e95d9250-251d-470a-a062-fa1922dfa9a8", "Temperature"],
  temperaturePeriod: [
    "e95d1b25-251d-470a-a062-fa1922dfa9a8",
    "Temperature Period",
  ],
  txCharacteristic: [
    "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
    "Tx Characteristic",
  ],
  rxCharacteristic: [
    "6e400003-b5a3-f393-e0a9-e50e24dcca9e",
    "Rx Characteristic",
  ],

  /**
   * Method that searches an UUID among the UUIDs of all the services and
   * characteristics and returns:
   * - in HTML blue color the name of the service/characteristic found.
   * - in HTML red color a message if the UUID has not been found.
   * @param uuid The service or characteristic UUID.
   * @param serviceOrCharacteristic True (or 1) if it is a service, and false
   * (or 0) if it is a characteristic.
   */
  searchUuid(uuid, serviceOrCharacteristic) {
    for (const key in microbitUuid) {
      if (uuid === microbitUuid[key][0]) {
        return "<font color='blue'>" + microbitUuid[key][1] + "</font>";
      }
    }
    if (serviceOrCharacteristic) {
      return "<font color='red'>Unknown Micro:Bit Service</font>";
    } else {
      return "<font color='red'>Unknown Micro:Bit Characteristic</font>";
    }
  },
};
