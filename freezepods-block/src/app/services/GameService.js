import { MicrobitUuid } from "../components/MicrobitUuid";

class GameService {
  constructor(gameType, characteristicType = null, handler) {
    this.gameType = gameType;
    this.characteristicType = characteristicType;
    this.service = null;
    this.characteristic = null;
    this.handler = handler;
    this.eventListenerAdded = false;
  }

  async fetchService(server) {
    try {
      console.log("Server:", server);
      const { serviceUuid, characteristicUuid } =
        this.getServiceInfoForGameType(this.gameType, this.characteristicType);
      if (!serviceUuid || !characteristicUuid) {
        console.error(
          "No valid service UUID or characteristic UUID found for gameType:",
          this.gameType
        );
        return;
      }

      this.service = await server.getPrimaryService(serviceUuid);
      if (!this.service) {
        console.error(`Service with UUID ${serviceUuid} not found`);
        return;
      }

      console.log("Service fetched successfully:", this.service);

      this.characteristic = await this.service.getCharacteristic(
        characteristicUuid
      );
      if (!this.characteristic) {
        console.error("Characteristic not found");
      } else {
        console.log(`Characteristic fetched: ${this.characteristic.uuid}`);
      }
    } catch (error) {
      console.error("Error fetching service or characteristic:", error);
    }
  }

  async enableNotifications() {
    console.log(
      "Enabling notifications for characteristic:",
      this.characteristic.uuid
    );
    try {
      if (
        !(
          this.characteristic.properties.notify ||
          this.characteristic.properties.indicate
        )
      ) {
        console.error(
          `Characteristic ${this.characteristic.uuid} does not support notifications.`
        );
        return;
      }
      await this.characteristic.startNotifications();
      this.characteristic.addEventListener(
        "characteristicvaluechanged",
        this.handler.bind(this)
      );
      this.eventListenerAdded = true;
    } catch (error) {
      console.error("Failed to enable notifications:", error);
    }
  }

  async startNotifications() {
    if (!this.characteristic) {
      console.error("Characteristic not available to start notifications");
      return;
    }

    if (this.eventListenerAdded) {
      await this.stopNotifications();
    }

    try {
      await this.stopNotifications();
      await this.enableNotifications(this.characteristic);
      console.log(
        `Notifications started for characteristic: ${this.characteristic.uuid}`
      );
    } catch (error) {
      console.error(
        `Error starting notifications for characteristic ${this.characteristic.uuid}:`,
        error
      );
    }
  }

  async stopNotifications() {
    if (!this.characteristic) {
      console.error("Characteristic not available to stop notifications");
      return;
    }

    try {
      await this.characteristic.stopNotifications();
      this.characteristic.removeEventListener(
        "characteristicvaluechanged",
        this.handler.bind(this)
      );
      this.eventListenerAdded = false;
      console.log(
        `Notifications stopped for characteristic: ${this.characteristic.uuid}`
      );
    } catch (error) {
      console.error(
        `Error stopping notifications for characteristic ${this.characteristic.uuid}:`,
        error
      );
    }
  }

  getServiceInfoForGameType(gameType, characteristicType) {
    switch (gameType) {
      case "button":
        return {
          serviceUuid: MicrobitUuid.buttonService[0],
          characteristicUuid:
            this.getButtonCharacteristicUuid(characteristicType),
        };
      case "led":
        return {
          serviceUuid: MicrobitUuid.ledService[0],
          characteristicUuid: MicrobitUuid.ledMatrixState[0],
        };
      case "accelerometer":
        return {
          serviceUuid: MicrobitUuid.accelerometerService[0],
          characteristicUuid: MicrobitUuid.accelerometerData[0],
        };
      case "magnetometer":
        return {
          serviceUuid: MicrobitUuid.magnetometerService[0],
          characteristicUuid: MicrobitUuid.magnetometerData[0],
        };
      case "temperature":
        return {
          serviceUuid: MicrobitUuid.temperatureService[0],
          characteristicUuid: MicrobitUuid.temperature[0],
        };
      default:
        console.error("Unknown gameType:", gameType);
        return {};
    }
  }

  getButtonCharacteristicUuid(characteristicType) {
    switch (characteristicType) {
      case "A":
        return MicrobitUuid.buttonAState[0];
      case "B":
        return MicrobitUuid.buttonBState[0];
      default:
        console.error(
          "Unknown button characteristic type:",
          characteristicType
        );
        return null;
    }
  }
}
export { GameService };
