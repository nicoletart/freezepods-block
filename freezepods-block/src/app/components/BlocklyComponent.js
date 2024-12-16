"use client";

import React, { useEffect, useRef, useState } from "react";
import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import AnimatedButton from "./AnimatedButton";
import { useRounds } from "../context/BlocklyContext";

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
      this.appendDummyInput()
        .appendField("Set timer expiration to")
        .appendField(new Blockly.FieldNumber(3, 1, 15), "TIMER");
      this.setColour(300);
      this.setTooltip("Set the timer expiration for the game.");
    },
  };

  javascriptGenerator["rounds_set"] = function (block) {
    const rounds = block.getFieldValue("ROUNDS") || 5;
    return `let rounds = ${rounds};\n`;
  };

  customBlocksSet.add("rounds_set");
  customBlocksSet.add("timer_length");
};

export default function BlocklyComponent() {
  const { setRounds, setTimerLength } = useRounds();
  const blocklyDiv = useRef(null);
  const workspaceRef = useRef(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [savedInformation, setSavedInformation] = useState("");
  const [customBlocks, setCustomBlocks] = useState([
    "rounds_set",
    "timer_length",
  ]);

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

  // const handleGenerateCode = () => {
  //   console.log("Generating code from workspace...");
  //   const workspace = workspaceRef.current;

  //   if (workspace) {
  //     try {
  //       const code = javascriptGenerator.workspaceToCode(workspace);
  //       setGeneratedCode(code);
  //     } catch (error) {
  //       console.error("Error while generating JavaScript code:", error);
  //     }
  //   } else {
  //     console.error("No Blockly workspace found.");
  //   }
  // };

  const resetWorkspace = () => {
    console.log("Clearing Blockly workspace");
    const workspace = workspaceRef.current;

    if (workspace) {
      workspace.clear();
      // setGeneratedCode("");
      setSavedInformation("");
    } else {
      console.error("No Blockly workspace");
    }
  };

  const saveWorkspace = () => {
    console.log("Saving Blockly workspace");
    const workspace = workspaceRef.current;

    if (workspace) {
      const workspaceXml = Blockly.Xml.workspaceToDom(workspace);
      const workspaceText = Blockly.Xml.domToText(workspaceXml);

      localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceText);

      const roundsBlock = workspace.getAllBlocks().find((b) => b.type === "rounds_set");
      const timerBlock = workspace.getAllBlocks().find((b) => b.type === "timer_length");

      if (roundsBlock) {
        const roundsValue = roundsBlock.getFieldValue("ROUNDS");
        setRounds(roundsValue);
        console.log(`Number of rounds set to ${roundsValue}`);
      } else {
        console.error("rounds_set block is not in the workspace");
      }

      if (timerBlock) {
        const timerLengthValue = timerBlock.getFieldValue("TIMER");
        setTimerLength(timerLengthValue);
        console.log(`Timer length set to ${timerLengthValue}`);
      } else {
        console.error("timer_length block is not in the workspace");
      }

      setSavedInformation(
        `Number of rounds set to ${roundsBlock ? roundsBlock.getFieldValue("ROUNDS") : "N/A"}.\nTimer length set to ${timerBlock ? timerBlock.getFieldValue("TIMER") : "N/A"}`
      );
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
        {/* <AnimatedButton onClick={handleGenerateCode}>
          Generate Code
        </AnimatedButton> */}
        <AnimatedButton onClick={resetWorkspace}>
          Clear Workspace
        </AnimatedButton>
        <AnimatedButton onClick={saveWorkspace}>Save Workspace</AnimatedButton>
      </div>

      {generatedCode && (
        <pre
          style={{
            backgroundColor: "grey",
            padding: "10px",
            borderRadius: "5px",
            maxWidth: "800px",
            margin: "20px",
            overflow: "auto",
          }}
        >
          {generatedCode}
        </pre>
      )}

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
