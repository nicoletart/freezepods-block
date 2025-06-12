"use client";

import React, { useEffect, useRef, useState } from "react";
import * as Blockly from "blockly";
import "blockly/javascript";
import { javascriptGenerator, Order } from "blockly/javascript";
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

  // Blockly.Blocks['create_variable'] = {
  //   init: function() {
  //     this.appendDummyInput()  // Use this to define the block's text fields
  //       .appendField("Create variable")
  //       .appendField(new Blockly.FieldTextInput('var_name'), 'VAR_NAME')  // User-defined variable name
  //       .appendField("to set to");

  //     this.appendValueInput('VALUE')  // Input for setting the variable's value
  //       .setCheck(null)  // No specific type check here
  //       .appendField('set to');

  //     this.setColour(230);  // Color of the block
  //     this.setOutput(true, 'Variable');  // Set this block as an output block
  //     this.setTooltip("Create a variable and assign a value.");  // Tooltip text for the block
  //   }
  // }

  Blockly.Blocks["create_variable"] = {
    init: function () {
      // Define the function to specify the handler function name
      this.appendDummyInput()
        .appendField("Create variable")
        .appendField(new Blockly.FieldTextInput("var_name"), "VARIABLE_NAME"); // User-defined variable name

      this.appendValueInput("VALUE")
        .setCheck(null) // Define the type (number or string)
        .appendField("set to");

      // Block color and tooltip
      this.setColour(230);
      this.setTooltip("Define a handler function for a selected sensor event.");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
    },
  };

  javascriptGenerator.forBlock["create_variable"] = function (block) {
    // Get the variable name input by the user
    const variableName = block.getFieldValue("VARIABLE_NAME");

    // Get the value for the variable
    const value = javascriptGenerator.valueToCode(
      block,
      "VALUE",
      javascriptGenerator.ORDER_ATOMIC
    );

    // Generate JavaScript code that defines the variable and assigns a value
    return `let ${variableName} = ${value};\n`;
  };

  customBlocksSet.add("create_variable");

  Blockly.Blocks["define_event_handler"] = {
    init: function () {
      // Define the function to specify the handler function name
      this.appendDummyInput()
        .appendField("Define Event Handler Function")
        .appendField(new Blockly.FieldTextInput(""), "HANDLER_NAME");

      // Dropdown for selecting the sensor type
      this.appendDummyInput()
        .appendField("Sensor Type:")
        .appendField(
          new Blockly.FieldDropdown([
            ["Button", "button"],
            ["LED", "led"],
            ["Accelerometer", "accelerometer"],
            ["Magnetometer", "magnetometer"],
          ]),
          "SENSOR_TYPE"
        );

      // Block color and tooltip
      this.setColour(230);
      this.setTooltip("Define a handler function for a selected sensor event.");
      this.setNextStatement(true);
    },
  };

  javascriptGenerator.forBlock["define_event_handler"] = function (block) {
    // Get the function name input by the user
    const handlerName = block.getFieldValue("HANDLER_NAME");

    // Get the sensor type selected by the user from the dropdown
    const sensorType = block.getFieldValue("SENSOR_TYPE");

    // Generate JavaScript code that defines the event handler for the selected sensor type
    return `
      const ${handlerName} = (event) => {
        // Check if the event matches the selected sensor type
        if (gameType != "${sensorType}") {
          console.error("Mismatched sensor type. Expected: ${sensorType}, but got: " + gameType);
          return;
        }
      `;
  };

  Blockly.Blocks["get_accelerometer_xyz"] = {
    init: function () {
      this.appendDummyInput().appendField(
        "Get X, Y, Z from accelerometer sensor data"
      );
      this.setColour(230);
      this.setTooltip(
        "Extracts X, Y, Z values from the accelerometer sensor data."
      );
      this.setPreviousStatement(true); // Allow this block to connect to the previous one
      this.setNextStatement(true); // Allow this block to connect to the next one
    },
  };

  javascriptGenerator.forBlock["get_accelerometer_xyz"] = function (block) {
    return `const x = data.getInt16(0, true);
    const y = data.getInt16(2, true);
    const z = data.getInt16(4, true);\n`;
  };

  Blockly.Blocks["shake_detected"] = {
    init: function () {
      this.appendDummyInput().appendField(
        "Shake detected in accelerometer sensor data"
      );
      this.setColour(230);
      this.setTooltip("Shake detected in the accelerometer sensor data");
      this.setPreviousStatement(true); // Allow this block to connect to the previous one
      this.setNextStatement(true); // Allow this block to connect to the next one
    },
  };

  javascriptGenerator.forBlock["shake_detected"] = function (block) {
    return `console.log("Shake detected!");
        const reactionTime = now - startTime.current;
        rankings.current.push(reactionTime);
        gameState.round = gameState.round + 1;

        setGameState((prev) => ({
          ...prev,
          score: prev.score + 1,
          round: gameState.round,
        }));
        startTime.current = null;
        lastShakeValues.current = { x, y, z };

        nextRound();
      }
    lastShakeValues.current = { x, y, z };\n`;
  };

  customBlocksSet.add("shake_detected");

  Blockly.Blocks["calculate_accelerometer_movement"] = {
    init: function () {
      this.appendDummyInput().appendField(
        "Calculate difference in movmement in accelerometer"
      );
      this.setColour(230);
      this.setTooltip("Calculate difference in movmement in accelerometer.");
      this.setOutput(true, "Number");
    },
  };

  javascriptGenerator.forBlock["calculate_accelerometer_movement"] = function (
    block
  ) {
    return [`calculateShake(x, y, z)`, javascriptGenerator.ORDER_ATOMIC];
  };

  Blockly.Blocks["rounds_set"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Set number of game rounds to")
        .appendField(new Blockly.FieldNumber(1, 1, 12), "ROUNDS");
      this.setColour(10);
      this.setTooltip("Set the number of rounds for the game.");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
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
      this.setPreviousStatement(true);
      this.setNextStatement(true);
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

  javascriptGenerator.forBlock["rounds_set"] = function (block) {
    const rounds = block.getFieldValue("ROUNDS") || 5;
    return `const rounds = ${rounds};\n`;
  };

  javascriptGenerator.forBlock["timer_length"] = function (block) {
    // Get the value from the input field for "TIME"
    var time = javascriptGenerator.valueToCode(
      block,
      "TIME",
      javascriptGenerator.ORDER_ATOMIC
    );
    return `const timerLength = ${time};\n`; // Use the time value in the generated code
  };

  javascriptGenerator.forBlock["choose_button"] = function (block) {
    const button = block.getFieldValue("BUTTON");
    return `const button = "${button}";\n`;
  };

  // Score variable handling
  javascriptGenerator.forBlock["score_variable"] = function (block) {
    const scoreVar = block.getFieldValue("SCORE");
    return `let ${scoreVar} = 0;\n`;
  };

  javascriptGenerator.forBlock["game_logic"] = function (block) {
    const rounds = block.getFieldValue("ROUND");
    const timer = block.getFieldValue("TIMER");

    // Generate JavaScript code for the block
    const code = `
    let rounds = ${rounds};
    let timerLength = ${timer};
    let score = 0;
    let chosenButton = "A"; // Example of setting the button

    for (let round = 0; round < rounds; round++) {
      basic.showString("Round " + (round + 1));
      let startTime = input.runningTime();

      // Wait for the timer
      while (input.runningTime() - startTime < timerLength * 1000) {
        // Check for button press
        if (input.buttonIsPressed(Button.A)) {
          if (chosenButton === "A") {
            score++;
            basic.showIcon(IconNames.Happy);
          }
        } else if (input.buttonIsPressed(Button.B)) {
          if (chosenButton === "B") {
            score++;
            basic.showIcon(IconNames.Happy);
          }
        }
      }

      // Show score after each round
      basic.showNumber(score);
      basic.pause(1000); // Wait for 1 second before next round
    }
  `;
    console.log(code);
    return code;
  };

  Blockly.Blocks["end_function"] = {
    init: function () {
      this.appendDummyInput().appendField("End Function");
      this.setColour(230);
      this.setTooltip("End the function with a closing bracket.");
      this.setPreviousStatement(true);
    },
  };

  javascriptGenerator.forBlock["end_function"] = function (block) {
    return `}\n`;
  };

  Blockly.Blocks["on_game_start"] = {
    init: function () {
      this.appendDummyInput().appendField("When game starts");
      this.appendStatementInput("DO").setCheck(null).appendField("do");
      this.setColour(230); // Choose a color for your block
      this.setPreviousStatement(false, null);
      this.setNextStatement(false, null);
      this.setTooltip("Triggers when the game starts");
      this.setHelpUrl("");
    },
  };

  javascriptGenerator.forBlock["on_game_start"] = function (block) {
    const statements_do = javascriptGenerator.statementToCode(block, "DO");
    return statements_do;
  };
  customBlocksSet.add("on_game_start");
  customBlocksSet.add("end_function");

  customBlocksSet.add("rounds_set");
  customBlocksSet.add("timer_length");
  customBlocksSet.add("choose_button");
  customBlocksSet.add("score_variable");
  customBlocksSet.add("game_logic");
  customBlocksSet.add("define_event_handler");
  customBlocksSet.add("get_accelerometer_xyz");
  customBlocksSet.add("calculate_accelerometer_movement");

  Blockly.Blocks["choose_sensor"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Choose sensor")
        .appendField(
          new Blockly.FieldDropdown([
            ["Button", "button"],
            ["Light Sensor", "lightSensor"],
            ["Accelerometer", "accelerometer"],
            ["Magnetometer", "magnetometer"],
            ["Temperature", "temperature"]
          ]),
          "SENSOR"
        );
      this.setColour(160);
      this.setTooltip("Choose which sensor to use for the game.");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
    },
  };

  Blockly.Blocks["set_sensor_threshold"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Set threshold for")
        .appendField(
          new Blockly.FieldDropdown([
            ["Accelerometer (shake)", "accelerometer"],
            ["Magnetometer (magnetic field)", "magnetometer"],
            ["Temperature (°C)", "temperature"],
            ["Light Level", "lightSensor"]
          ]),
          "SENSOR"
        )
        .appendField("to")
        .appendField(new Blockly.FieldNumber(0), "THRESHOLD");
      this.setColour(160);
      this.setTooltip("Set the threshold value that triggers a point in the game.");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
    },
  };

  Blockly.Blocks["sensor_event"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("When")
        .appendField(
          new Blockly.FieldDropdown([
            ["Button is pressed", "button"],
            ["Light is covered", "lightSensor"],
            ["Device is shaken", "accelerometer"],
            ["Magnetic field detected", "magnetometer"],
            ["Temperature reached", "temperature"]
          ]),
          "EVENT"
        );
      this.appendStatementInput("DO")
        .setCheck(null)
        .appendField("do");
      this.setColour(230);
      this.setTooltip("Triggers when the selected sensor event occurs.");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
    },
  };

  Blockly.Blocks["get_sensor_value"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Get value from")
        .appendField(
          new Blockly.FieldDropdown([
            ["Accelerometer", "accelerometer"],
            ["Magnetometer", "magnetometer"],
            ["Temperature", "temperature"],
            ["Light Sensor", "lightSensor"]
          ]),
          "SENSOR"
        );
      this.setOutput(true, "Number");
      this.setColour(230);
      this.setTooltip("Get the current value from the selected sensor.");
    },
  };

  javascriptGenerator.forBlock["choose_sensor"] = function (block) {
    const sensor = block.getFieldValue("SENSOR");
    return `const gameType = "${sensor}";\n`;
  };

  javascriptGenerator.forBlock["set_sensor_threshold"] = function (block) {
    const sensor = block.getFieldValue("SENSOR");
    const threshold = block.getFieldValue("THRESHOLD");
    return `const ${sensor}Threshold = ${threshold};\n`;
  };

  javascriptGenerator.forBlock["sensor_event"] = function (block) {
    const event = block.getFieldValue("EVENT");
    const statements = javascriptGenerator.statementToCode(block, "DO");
    return `
    if (gameType === "${event}") {
      ${statements}
    }
    `;
  };

  javascriptGenerator.forBlock["get_sensor_value"] = function (block) {
    const sensor = block.getFieldValue("SENSOR");
    return [`get${sensor}Value()`, javascriptGenerator.ORDER_FUNCTION_CALL];
  };

  customBlocksSet.add("choose_sensor");
  customBlocksSet.add("set_sensor_threshold");
  customBlocksSet.add("sensor_event");
  customBlocksSet.add("get_sensor_value");
};

export default function BlocklyEditor() {
  const { devices } = useDevices();
  const { setRounds, setTimerLength, setButton, setCode } = useBlocklyContext();
  const blocklyDiv = useRef(null);
  const workspaceRef = useRef(null);
  const [savedInformation, setSavedInformation] = useState("");

  useEffect(() => {
    getCustomBlocks();

    if (blocklyDiv.current) {
      console.log("Injecting Blockly workspace...");
      const toolboxXml = `
        <xml xmlns="https://developers.google.com/blockly/xml">
          <category name="Game Setup" colour="160">
            <block type="rounds_set"></block>
            <block type="timer_length"></block>
            <block type="choose_button"></block>
            <block type="choose_sensor"></block>
            <block type="set_sensor_threshold"></block>
          </category>
          <category name="Sensors" colour="230">
            <block type="sensor_event"></block>
            <block type="get_sensor_value"></block>
            <block type="get_accelerometer_xyz"></block>
            <block type="shake_detected"></block>
            <block type="calculate_accelerometer_movement"></block>
          </category>
          <category name="Logic" colour="210">
            <block type="controls_if"></block>
            <block type="logic_compare"></block>
            <block type="logic_operation"></block>
            <block type="logic_negate"></block>
            <block type="logic_boolean"></block>
          </category>
          <category name="Loops" colour="120">
            <block type="controls_repeat_ext"></block>
            <block type="controls_whileUntil"></block>
            <block type="controls_for"></block>
          </category>
          <category name="Math" colour="230">
            <block type="math_number"></block>
            <block type="math_arithmetic"></block>
            <block type="math_single"></block>
          </category>
          <category name="Variables" colour="330" custom="VARIABLE"></category>
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
    const code = convertToJavaScript();
    if (code) {
      console.log(code);
      // compileToHex(code) // Call the function to compile the JS code to .hex
      //   .then(() => {
      //     console.log("Hex file generated and ready to download.");
      //   })
      //   .catch((error) => {
      //     console.error("Failed to compile to hex:", error);
      //   });
    }
  };

  const convertToJavaScript = () => {
    const workspace = workspaceRef.current;
    if (workspace) {
      try {
        // Get all the blocks in the workspace
        const blocks = workspace.getAllBlocks();
        
        // Generate code for each block
        let code = '';
        
        // First, generate game setup code
        const setupBlocks = blocks.filter(block => 
          ['rounds_set', 'timer_length', 'choose_button', 'choose_sensor', 'set_sensor_threshold'].includes(block.type)
        );
        setupBlocks.forEach(block => {
          code += javascriptGenerator.blockToCode(block);
        });
        
        // Then, generate sensor event handlers
        const eventBlocks = blocks.filter(block => 
          ['sensor_event', 'on_game_start'].includes(block.type)
        );
        eventBlocks.forEach(block => {
          code += javascriptGenerator.blockToCode(block);
        });
        
        // Finally, generate remaining blocks
        const otherBlocks = blocks.filter(block => 
          !setupBlocks.includes(block) && !eventBlocks.includes(block)
        );
        otherBlocks.forEach(block => {
          code += javascriptGenerator.blockToCode(block);
        });

        console.log("Generated code:", code);
        return code;
      } catch (error) {
        console.error("Error generating code:", error);
        return '';
      }
    } else {
      console.error("No Blockly workspace");
      return "";
    }
  };

  async function compileToHex(code) {
    try {
      console.log(code, JSON.stringify({ code }));
      const response = await fetch("/api/compile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }), // Send the JavaScript code for compilation
      });

      const data = await response.json();
      console.log(data);
      if (data.hex) {
        console.log("Hex file generated:", data.hex);
        // Handle the downloaded .hex file (e.g., trigger a download, etc.)
      } else {
        console.error("Compilation error:", data.error);
      }
    } catch (error) {
      console.error("Error during compilation:", error);
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
      const sensorBlock = workspace
        .getAllBlocks()
        .find((b) => b.type === "choose_sensor");

      const roundsValue = roundsBlock
        ? parseInt(roundsBlock.getFieldValue("ROUNDS"), 10) || 5
        : 5;
      setRounds(roundsValue);

      const timerValue = timerBlock
        ? parseInt(
            javascriptGenerator.valueToCode(
              timerBlock,
              "TIME",
              javascriptGenerator.ORDER_ATOMIC
            ),
            10
          ) || 5
        : 5;
      setTimerLength(timerValue);

      const buttonValue = buttonBlock
        ? buttonBlock.getFieldValue("BUTTON") || "A"
        : "A";
      setButton(buttonValue);

      const code = convertToJavaScript();
      setCode(code);

      let info = "";
      if (roundsBlock) {
        info += `Number of rounds set to ${roundsValue}.\n`;
      }
      if (timerBlock) {
        info += `Timer length set to ${timerValue}.\n`;
      }
      if (buttonBlock) {
        info += `Button selected: ${buttonValue}.\n`;
      }
      if (sensorBlock) {
        info += `Sensor selected: ${sensorBlock.getFieldValue("SENSOR")}.\n`;
      }
      setSavedInformation(info);
    } else {
      console.error("No Blockly workspace");
    }
  };

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "20px",
      }}
    >
      <div
        ref={blocklyDiv}
        style={{
          height: "500px",
          width: "800px",
        }}
      ></div>

      <div style={{ display: "flex", gap: "20px" }}>
        <AnimatedButton onClick={resetWorkspace}>
          Clear Workspace
        </AnimatedButton>
        <AnimatedButton onClick={saveWorkspace}>Save Workspace</AnimatedButton>
        <AnimatedButton onClick={handleRunCode}>Run Code</AnimatedButton>
      </div>

      {savedInformation && (
        <pre
          style={{
            backgroundColor: "grey",
            padding: "5px",
            borderRadius: "5px",
            maxWidth: "800px",
            margin: "20px",
            overflow: "auto",
          }}
        >
          {savedInformation}
        </pre>
      )}
    </div>
  );
}

var item;

const handler = (event) => {
  // Check if the event matches the selected sensor type
  if (gameType === "accelerometer") {
    const data = event.target.value;
    // Add your sensor-specific logic here (e.g., processing accelerometer data)
    console.log("accelerometer data received:", data);
  } else {
    console.error(
      "Mismatched sensor type. Expected: accelerometer, but got: " + gameType
    );
    return;
  }
  const x = data.getInt16(0, true);
  const y = data.getInt16(2, true);
  const z = data.getInt16(4, true);
  item = calculateShake(x, y, z);
  if (item > 4500) {
    console.log("Shake detected!");
    const reactionTime = now - startTime.current;
    rankings.current.push(reactionTime);
    gameState.round = gameState.round + 1;

    setGameState((prev) => ({
      ...prev,
      score: prev.score + 1,
      round: gameState.round,
    }));
    startTime.current = null;
    lastShakeValues.current = { x, y, z };

    nextRound();
  }
  lastShakeValues.current = { x, y, z };
};
