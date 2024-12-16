import { MicrobitUuid } from "./MicrobitUuid";

let isOperationInProgress = false;

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
    console.log("Device screen turned off!");
  } catch (error) {
    console.error("Failed to turn off the device:", error);
  } finally {
    isOperationInProgress = false;
  }
};
