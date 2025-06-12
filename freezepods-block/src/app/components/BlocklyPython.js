"use client";

import React, { useEffect, useRef, useState } from "react";
import * as Blockly from "blockly";
import "blockly/python"; // Change this to python
import { pythonGenerator } from "blockly/python"; // Use the Python generator
import AnimatedButton from "./AnimatedButton";
import { useBlocklyContext } from "../context/BlocklyContext";
import { useDevices } from "../context/ConnectedDevicesContext";
import { MicrobitHex } from "./MicrobitHex";

const customBlocksSet = new Set();

const WORKSPACE_STORAGE_KEY = "blocklyWorkspace";

const getCustomBlocks = () => {
  if (customBlocksSet.has("rounds_set")) {
    console.log("Custom block 'rounds_set' is already registered.");
    return;
  }

  Blockly.Blocks["rounds_set"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Set number of game rounds to")
        .appendField(new Blockly.FieldNumber(1, 1, 12), "ROUNDS");
      this.setColour(10);
      this.setTooltip("Set the number of rounds for the game.");
    },
  };

  Blockly.Blocks["timer_length"] = {
    init: function () {
      this.appendValueInput("TIME")
        .setCheck("Number")
        .appendField("Set timer length to");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(160);
      this.setTooltip("Set the timer length");
      this.setHelpUrl("");
    },
  };

  Blockly.Blocks["choose_button"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Choose button")
        .appendField(
          new Blockly.FieldDropdown([
            ["A", "A"],
            ["B", "B"],
          ]),
          "BUTTON"
        );
      this.setColour(160);
      this.setTooltip("Choose between button A and B for the game.");
    },
  };

  Blockly.Blocks["score_variable"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Score")
        .appendField(new Blockly.FieldVariable("score"), "SCORE");
      this.setColour(230);
      this.setTooltip("Variable to store the score.");
    },
  };

  Blockly.Blocks["game_logic"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Start round with")
        .appendField(new Blockly.FieldNumber(1), "ROUND")
        .appendField("rounds, timer set to")
        .appendField(new Blockly.FieldNumber(5), "TIMER")
        .appendField("seconds.");
      this.setColour(20);
      this.setTooltip("Game logic: number of rounds and timer.");
    },
  };

  // Python code generation for blocks
  pythonGenerator["rounds_set"] = function (block) {
    const rounds = block.getFieldValue("ROUNDS") || 5;
    return `rounds = ${rounds}\n`;
  };

  pythonGenerator.forBlock["timer_length"] = function (block) {
    const time = pythonGenerator.valueToCode(block, "TIME", pythonGenerator.ORDER_ATOMIC);
    return `time = ${time}\n`;
  };

  pythonGenerator.forBlock["choose_button"] = function (block) {
    const button = block.getFieldValue("BUTTON");
    return `chosen_button = "${button}"\n`;
  };

  // Score variable handling
  pythonGenerator.forBlock["score_variable"] = function (block) {
    const scoreVar = block.getFieldValue("SCORE");
    return `score = 0\n`; // Always initialize score to 0 in Python
  };

  pythonGenerator.forBlock["game_logic"] = function (block) {
    const rounds = block.getFieldValue("ROUND");
    const timer = block.getFieldValue("TIMER");

    const code = `
rounds = ${rounds}
timer_length = ${timer}
score = 0
chosen_button = "A"  # Example of setting the button

for round in range(rounds):
    display.show(f"Round {round + 1}")
    start_time = running_time()

    while running_time() - start_time < timer_length * 1000:
        if button_a.is_pressed():
            if chosen_button == "A":
                score += 1
                display.show(Image.HAPPY)
        elif button_b.is_pressed():
            if chosen_button == "B":
                score += 1
                display.show(Image.HAPPY)

    display.show(score)
    sleep(1000)  # Wait for 1 second before next round
    `;
    console.log(code);
    return code;
  };

  customBlocksSet.add("rounds_set");
  customBlocksSet.add("timer_length");
  customBlocksSet.add("choose_button");
  customBlocksSet.add("score_variable");
  customBlocksSet.add("game_logic");
};

export default function BlocklyPython() {
  const { devices } = useDevices();
  const { setRounds, setTimerLength, setButton } = useBlocklyContext();
  const blocklyDiv = useRef(null);
  const workspaceRef = useRef(null);
  const [savedInformation, setSavedInformation] = useState("");

  useEffect(() => {
    getCustomBlocks();

    if (blocklyDiv.current) {
      console.log("Injecting Blockly workspace...");
      const toolboxXml = `
        <xml xmlns="https://developers.google.com/blockly/xml">
          <block type="controls_if"></block>
          <block type="logic_compare"></block>
          <block type="math_number"></block>
          <block type="math_arithmetic"></block>
          <block type="text"></block>
          <block type="text_print"></block>
          <block type="rounds_set"></block>
          <block type="timer_length"></block>
          <block type="score_variable"></block>
          <block type="game_logic"></block>
        </xml>
      `;

      const parser = new DOMParser();
      const toolboxDom = parser.parseFromString(toolboxXml, "text/xml");

      const workspace = Blockly.inject(blocklyDiv.current, {
        toolbox: toolboxDom.documentElement,
        scrollbars: true,
        trashcan: true,
      });

      workspaceRef.current = workspace;

      const localStorageWorkspace = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (localStorageWorkspace) {
        const dom = Blockly.utils.xml.textToDom(localStorageWorkspace);
        Blockly.Xml.domToWorkspace(dom, workspace);
        console.log("Workspace loaded from localStorage");
      }

      return () => {
        console.log("Disposing Blockly workspace");
        const workspaceXml = Blockly.Xml.workspaceToDom(workspace);
        localStorage.setItem(
          WORKSPACE_STORAGE_KEY,
          Blockly.Xml.domToText(workspaceXml)
        );
        workspace.dispose();
      };
    }
  }, []);

  const handleRunCode = () => {
    const code = convertToPython();  // Change this to convert to Python
    if (code) {
      console.log("Running code...");
      compileToHex(code) // Call the function to compile the Python code to .hex
        .then(() => {
          console.log("Hex file generated and ready to download.");
        })
        .catch((error) => {
          console.error("Failed to compile to hex:", error);
        });
    }
  };

  const convertToPython = () => {
    const workspace = workspaceRef.current;
    if (workspace) {
      console.log("Workspace:", workspace);
      const code = pythonGenerator.workspaceToCode(workspace);  // Use Python generator
      console.log(code);
      return code;
    } else {
      console.error("No Blockly workspace");
      return "";
    }
  };

  async function compileToHex(code) {
    try {
      console.log(code, JSON.stringify({ code }));
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }), // Send the Python code for compilation
      });
  
      const data = await response.json();
      console.log(data);
      if (data.hex) {
        console.log('Hex file generated:', data.hex);
        // Handle the downloaded .hex file (e.g., trigger a download, etc.)
      } else {
        console.error('Compilation error:', data.error);
      }
    } catch (error) {
      console.error('Error during compilation:', error);
    }
  }

  const uploadToMicrobits = async (hexFile) => {
    const fileData = new Uint8Array(Buffer.from(hexFile, "hex"));

    for (const device of devices) {
      try {
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(
          MicrobitUuid.uartService[0]
        );
        const characteristic = await service.getCharacteristic(
          MicrobitUuid.uartCharacteristic[0]
        );

        await characteristic.writeValue(fileData);
        console.log(`Uploaded to ${device.name}`);
      } catch (error) {
        console.error(`Failed to upload to ${device.name}:`, error);
      }
    }
    alert("Code uploaded to all connected micro:bits!");
  };

  const resetWorkspace = () => {
    console.log("Clearing Blockly workspace");
    const workspace = workspaceRef.current;

    if (workspace) {
      workspace.clear();
      setSavedInformation("");
    } else {
      console.error("No Blockly workspace");
    }
  };

  const saveWorkspace = () => {
    const workspace = workspaceRef.current;

    if (workspace) {
      const roundsBlock = workspace
        .getAllBlocks()
        .find((b) => b.type === "rounds_set");
      const timerBlock = workspace
        .getAllBlocks()
        .find((b) => b.type === "timer_length");
      const buttonBlock = workspace
        .getAllBlocks()
        .find((b) => b.type === "choose_button");

      const roundsValue = roundsBlock
        ? parseInt(roundsBlock.getFieldValue("ROUNDS"), 10) || 5
        : 5;
      setRounds(roundsValue);

      const timerValue = timerBlock
        ? parseInt(timerBlock.getFieldValue("TIMER"), 10) || 5
        : 5;
      setTimerLength(timerValue);

      const buttonValue = buttonBlock
        ? buttonBlock.getFieldValue("BUTTON") || "A"
        : "A";
      setButton(buttonValue);

      let info = "";
      if (roundsBlock) {
        info += `Number of rounds set to ${roundsValue}.\n`;
      }
      if (timerBlock) {
        info += `Timer length set to ${timerValue}.\n`;
      }
      if (buttonBlock) {
        info += `Button choice set to ${buttonValue}.\n`;
      }
      setSavedInformation(info);
    } else {
      console.error("No Blockly workspace");
    }
  };

  return (
    <div>
      <div ref={blocklyDiv} style={{ height: "500px" }} />
      <div>
        <AnimatedButton onClick={handleRunCode}>Run Python Code</AnimatedButton>
      </div>
      <MicrobitHex hexFile={savedInformation} />
    </div>
  );
}
