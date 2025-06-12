import { MicrobitUuid } from "./MicrobitUuid";

let isOperationInProgress = false;

export const readLightLevel = async (server) => {
  if (!server) {
    throw new Error("No server provided!");
  }
  // console.log("server in readLightLevel", server);
  const lightLevelService = await server.getPrimaryService(
    MicrobitUuid.uartService[0]
  );
  console.log("lightLevelService in readLightLevel", lightLevelService);
  if (!lightLevelService) {
    throw new Error("Light Level Service not found!");
  }

  const lightLevelCharacteristic = await lightLevelService.getCharacteristic(
    MicrobitUuid.uartRxCharacteristic[0]
  );
  // const notificationsSupported = await lightLevelCharacteristic.getDescriptors();
        // console.log('RX Characteristic Descriptors:', notificationsSupported);
  // console.log("lightLevelCharacteristic in readLightLevel", lightLevelCharacteristic);
  // const match = data.match(/Light Level: (\d+)/);
  // if (match) {
  //   const lightLevel = parseInt(match[1], 10);
  //   console.log("Light Level:", lightLevel); // You can now use the light level value
  // }

  let initialValue = await lightLevelCharacteristic.readValue();
  console.log("initialValue in readLightLevel", initialValue);

  if (!lightLevelCharacteristic) {
    throw new Error("Light Level Characteristic not found!");
  }

  return lightLevelCharacteristic;
};

const getLedMatrixState = async (device) => {
  if (!device) {
    throw new Error("No device provided!");
  }

  const server = device.server;
  const ledService = await server.getPrimaryService(MicrobitUuid.ledService[0]);

  if (!ledService) {
    throw new Error("LED Service not found!");
  }

  const ledMatrixState = await ledService.getCharacteristic(
    MicrobitUuid.ledMatrixState[0]
  );

  if (!ledMatrixState) {
    throw new Error("LED Matrix State Characteristic not found!");
  }

  return ledMatrixState;
};

export const lightUpDevice = async (device) => {
  if (isOperationInProgress) {
    console.warn("Previous operation still in progress. Please wait.");
    return;
  }

  isOperationInProgress = true;

  try {
    const ledMatrixState = await getLedMatrixState(device);
    const data = new Uint8Array([0x1f, 0x1f, 0x1f, 0x1f, 0x1f]);
    await ledMatrixState.writeValue(data);
    device.ledOn = true;
    console.log("Device screen lit up!");
  } catch (error) {
    console.error("Failed to light up the device:", error);
  } finally {
    isOperationInProgress = false;
  }
};

export const turnOffDevice = async (device) => {
  if (isOperationInProgress) {
    console.warn("Previous operation still in progress. Please wait.");
    return;
  }

  isOperationInProgress = true;

  try {
    const ledMatrixState = await getLedMatrixState(device);
    const data = new Uint8Array([0, 0, 0, 0, 0]);
    await ledMatrixState.writeValue(data);
    device.ledOn = false;
    console.log("Device screen turned off!");
  } catch (error) {
    console.error("Failed to turn off the device:", error);
  } finally {
    isOperationInProgress = false;
  }
};
