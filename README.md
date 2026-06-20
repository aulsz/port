# Collins Culbert | Engineering Portfolio

Personal portfolio for Collins Culbert, an Electrical Systems Engineering Technology student at Texas A&M University. The site presents work in robotics control, embedded firmware, FPGA design, hardware-software integration, and developing embedded AI skills.

## Featured engineering

- **Closed-loop robotic hand:** Ten-servo system using AS5600 magnetic encoders, I²C multiplexing, and per-finger PID control.
- **FPGA motor controller:** Seven-state Moore state machine for PWM motor-speed control on a DE10 FPGA.
- **STM32F4xx lab:** Register-level GPIO and SysTick programming in C without HAL abstraction.
- **STM32 vibration fault classifier:** Streaming vibration features and a
  readable C decision-tree model, with Python/C parity verification.
- **Embedded AI foundations:** Sensor-data workflows, lightweight inference,
  cross-language verification, and deployment planning.

## Interface

The portfolio uses a minimal glass interface inspired by high-end product design:

- Inter variable typography
- Persistent procedural fluid-node background
- Responsive glass navigation and card system
- Character-by-character text entrances on first view
- Scroll progress and active section navigation
- Subtle pointer light and card depth
- Reduced-motion support

## Built with

- Semantic HTML
- Modern CSS and responsive grid layouts
- Vanilla JavaScript
- Canvas rendering for the animated fluid field

No framework or build process is required.

## Run locally

Open `index.html` directly, or serve the folder:

```powershell
python -m http.server 4173
```

Then visit [http://127.0.0.1:4173](http://127.0.0.1:4173).

## Structure

```text
.
|-- assets/
|   |-- fonts/
|   |   |-- InterVariable.woff2
|   |   |-- InterVariable-Italic.woff2
|   |   `-- Inter-OFL.txt
|   `-- Collins_Culbert_Resume.pdf
|-- index.html
|-- script.js
`-- styles.css
```

Inter is distributed under the SIL Open Font License included in `assets/fonts/Inter-OFL.txt`.

## Contact

- [LinkedIn](https://linkedin.com/in/collinsculbert)
- [coculbert@icloud.com](mailto:coculbert@icloud.com)
