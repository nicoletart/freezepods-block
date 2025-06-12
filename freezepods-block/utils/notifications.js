import { MicrobitUuid } from "./microbitUuid";

export const stopNotifications = async (
  prevCharacteristicRef,
  handleButtonStateChanged
) => {
  try {
    if (prevCharacteristicRef.current) {
      console.log(
        "Stopping notifications for:",
        prevCharacteristicRef.current.uuid
      );
      await prevCharacteristicRef.current.stopNotifications();
      prevCharacteristicRef.current.removeEventListener(
        "characteristicvaluechanged",
        handleButtonStateChanged
      );
      console.log("Notifications stopped and listener removed.");
    }
    prevCharacteristicRef.current = null;
  } catch (error) {
    console.error("Error stopping notifications:", error);
  }
};

export const startNotifications = async (
  server,
  gameType,
  buttonState,
  prevCharacteristicRef,
  handleButtonStateChanged,
  handleUARTTxStateChanged
) => {
  try {
    await stopNotifications(prevCharacteristicRef, handleButtonStateChanged);

    const enableNotifications = async (characteristic, handler) => {
      console.log(
        "Enabling notifications for characteristic:",
        characteristic.uuid
      );
      try {
        if (
          !(
            characteristic.properties.notify ||
            characteristic.properties.indicate
          )
        ) {
          console.error(
            `Characteristic ${characteristic.uuid} does not support notifications.`
          );
          return;
        }
        await characteristic.startNotifications();
        characteristic.addEventListener("characteristicvaluechanged", handler);
      } catch (error) {
        console.error("Failed to enable notifications:", error);
      }
    };

    const enableNotificationsForService = async (state, handler) => {
      console.log("Notifications:", state.properties);
      if (state.properties.notify || state.properties.indicate) {
        prevCharacteristicRef.current = state;
        await enableNotifications(state, handler);
        console.log(`Notifications enabled for ${state.uuid}`);
      } else {
        console.warn(`${state.uuid} does not support notifications.`);
      }
    };

    if (gameType === "button") {
      const buttonService = await server.getPrimaryService(
        MicrobitUuid.buttonService[0]
      );
      if (!buttonService) {
        console.error("Button Service not found");
        return;
      }
      const buttonCharacteristic = await buttonService.getCharacteristic(
        buttonState
      );
      console.log("Button Characteristic:", buttonCharacteristic);

      await enableNotificationsForService(
        buttonCharacteristic,
        handleButtonStateChanged
      );
    }

    if (gameType === "lightSensor") {
      const uartService = await server.getPrimaryService(
        MicrobitUuid.uartService[0]
      );
      if (!uartService) {
        console.error("UART Service not found");
        return;
      }
      console.log("UART Service:", uartService);

      const uartTxCharacteristic = await uartService.getCharacteristic(
        MicrobitUuid.uartTxCharacteristic[0]
      );
      const uartRxCharacteristic = await uartService.getCharacteristic(
        MicrobitUuid.uartRxCharacteristic[0]
      );
      console.log("uartTxCharacteristic Characteristic:", uartTxCharacteristic);
      console.log("uartRxCharacteristic Characteristic:", uartRxCharacteristic);

      await enableNotificationsForService(
        uartTxCharacteristic,
        handleUARTTxStateChanged
      );
    }
  } catch (error) {
    console.error("Error subscribing to notifications:", error);
  }
};
