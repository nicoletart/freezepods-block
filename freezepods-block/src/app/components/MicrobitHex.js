export const MicrobitHex = () => {
  `bluetooth.onBluetoothConnected(function () {
        connected = 1
        basic.showIcon(IconNames.Yes)
        control.waitMicros(2000000)
        basic.clearScreen()
    })
    bluetooth.onBluetoothDisconnected(function () {
        connected = 0
        basic.showIcon(IconNames.No)
        basic.clearScreen()
    })
    let connected = 0
    connected = 0
    basic.showIcon(IconNames.Heart)
    bluetooth.startUartService()
    bluetooth.startLEDService()
    bluetooth.startAccelerometerService()
    bluetooth.startButtonService()
    bluetooth.startTemperatureService()
    bluetooth.startMagnetometerService()
    bluetooth.startIOPinService()`;
};
