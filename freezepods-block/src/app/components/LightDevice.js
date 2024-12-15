import { useEffect } from "react";
import { MicrobitUuid } from "./MicrobitUuid";

const LightDevice = ({ device }) => {
  useEffect(() => {
    if (device && device.services?.length) {
      const lightUp = async () => {
        try {
          console.log("Device services:", device.services);
          const ledService = device.services.find(
            (service) => service.uuid === MicrobitUuid.ledService[0]
          );

          if (!ledService) {
            console.error("LED Service not found!");
            return;
          }

          const ledMatrixState = await ledService.getCharacteristic(
            MicrobitUuid.ledMatrixState[0]
          );

          if (!ledMatrixState) {
            console.error("LED Matrix State Characteristic not found!");
            return;
          }

          const data = new Uint8Array([0x1f, 0x1f, 0x1f, 0x1f, 0x1f]);
          await ledMatrixState.writeValue(data);
          console.log("Device screen lit up!");
        } catch (error) {
          console.error("Failed to light up the device:", error);
        }
      };

      lightUp();
    } else {
      console.warn("Device or its services are not available.");
    }
  }, [device]);

  return null;
};

export default LightDevice;
