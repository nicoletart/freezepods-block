"use client";

import React, { useEffect, useRef, useState } from "react";
import * as Blockly from "blockly";
import "blockly/blocks";
import { javascriptGenerator } from "blockly/javascript";
import AnimatedButton from "./AnimatedButton";

export default function BlocklyComponent() {
  const blocklyDiv = useRef(null); // Blockly workspace container
  const [generatedCode, setGeneratedCode] = useState("");

  useEffect(() => {
    if (blocklyDiv.current) {
      const toolboxXml = `
        <xml xmlns="https://developers.google.com/blockly/xml">
          <block type="controls_if"></block>
          <block type="logic_compare"></block>
          <block type="math_number"></block>
          <block type="math_arithmetic"></block>
          <block type="text"></block>
          <block type="text_print"></block>
        </xml>
      `;

      const parser = new DOMParser();
      const toolboxDom = parser.parseFromString(toolboxXml, "text/xml");

      const workspace = Blockly.inject(blocklyDiv.current, {
        toolbox: toolboxDom.documentElement,
        scrollbars: true,
        trashcan: true,
      });

      return () => workspace.dispose();
    }
  }, []);

  const handleGenerateCode = () => {
    const workspace = Blockly.getMainWorkspace();

    if (workspace) {
      try {
        const code = javascriptGenerator.workspaceToCode(workspace);
        setGeneratedCode(code);
      } catch (error) {
        console.error("Error while generating JavaScript code:", error);
      }
    } else {
      console.error("No Blockly workspace");
    }
  };

  const resetWorkspace = () => {
    const workspace = Blockly.getMainWorkspace();

    if (workspace) {
      workspace.clear();
      setGeneratedCode("");
    } else {
      console.error("Blockly workspace missing");
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
        <AnimatedButton onClick={handleGenerateCode}>
          Generate Code
        </AnimatedButton>
        <AnimatedButton onClick={resetWorkspace}>
          Clear Workspace
        </AnimatedButton>
      </div>

      {generatedCode && (
        <pre
          style={{
            backgroundColor: "grey",
            padding: "10px",
            borderRadius: "5px",
            maxWidth: "800px",
            overflow: "auto",
          }}
        >
          {generatedCode}
        </pre>
      )}
    </div>
  );
}
