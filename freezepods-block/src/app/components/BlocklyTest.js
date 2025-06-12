// "use client";
// import React, { useEffect, useRef } from 'react';
// import Blockly from 'blockly/core';
// import 'blockly/blocks';
// import 'blockly/javascript';

// const BlocklyTest = () => {
//     const blocklyDiv = useRef(null);
//     const toolbox = {
//         "kind": "flyoutToolbox",
//         "contents": [
//             {
//                 "kind": "block",
//                 "type": "controls_if"
//             },
//             {
//                 "kind": "block",
//                 "type": "logic_compare"
//             },
//             {
//                 "kind": "block",
//                 "type": "math_number"
//             },
//             {
//                 "kind": "block",
//                 "type": "math_arithmetic"
//             },
//             {
//                 "kind": "block",
//                 "type": "text"
//             },
//             {
//                 "kind": "block",
//                 "type": "text_print"
//             }
//         ]
//     };

//     useEffect(() => {
//         const workspace = Blockly.inject(blocklyDiv.current, {
//             toolbox: toolbox,
//             scrollbars: true,
//             trashcan: true,
//         });

//         return () => {
//             workspace.dispose();
//         };
//     }, []);

//     return (
//         <div>
//             <h1>Blockly Test</h1>
//             <div
//                 ref={blocklyDiv}
//                 style={{ height: '500px', width: '100%', border: '1px solid #ccc' }}
//             ></div>
//         </div>
//     );
// };

// export default BlocklyTest;