"use client";

import React from "react";
import styled from "styled-components";

const RunnerLoader = () => {
  return (
    <StyledWrapper>
      <div className="loader">
        <svg
          className="logo"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          fill="currentColor"
          viewBox="0 0 374.9 351.8"
          preserveAspectRatio="xMidYMid meet"
        >
          <g id="Layer_1-2" data-name="Layer 1">
            <g>
              <path d="M154,286.5c1.35-1.32,2.57-2.76,4.07-3.93,17.75-13.93,43.09-24.27,60.87-38.12.87-.67,2.29-1.53,2.02-2.84l-95.93-67.13-.96-2.87,109.99-79.09-20.59-20.5-65.23,9.66-24.74,46.33h-62.5v-43.5l1.5-1.5h33.5l19.8-39.7,3.45-3.55,109.28-15.83,3.03,1.03,72.33,72.75-1.38,3.32-99.51,70.5,99.95,72.87-103.95,67.11v38c0,.23-1.72,1.97-2.45,2.09l-40.27.19-2.27-1.28v-64Z" />
              <path d="M45,351l-42.74.81-2.26-1.31v-75l4.46-2.54,99.49-30.51c4.28-3.09,11.47-34.07,13.7-34.53l40.38,13.54c1.78,1.74.94,4.45.52,6.59-1.96,9.86-10.48,32.51-14.53,42.46-1.13,2.77-2.1,6.74-4.48,8.52-28.01,10.49-58.22,16.74-86.3,26.7-2.84,1.01-6,1.46-8.24,3.76v41.5Z" />
              <path d="M312.76,130.24l6.85,14.84c3.3.55,27.65-11.84,33.57-13.39,1.88-.49,3.95-1.37,5.83-.21,2.66,1.63,13.82,34.47,15.89,39.87l-78.96,32.22-24.81-55.86c.53-1.82,2.96-2.75,4.49-3.59,10.19-5.55,23.03-9.04,33.37-14.69l3.77.81Z" />
              <path d="M322.67.12c4.76-1.53,32.63,12.01,39.65,13.04l1.59,1.48-24.57,69.26c-1.51.51-2.95-.08-4.4-.35-6.64-1.22-23.18-7.96-30.2-10.81-2.48-1-6.71-1.88-7.31-4.66,3.5-7.54,21.78-66.85,25.23-67.96Z" />
            </g>
          </g>
        </svg>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  /* SVG loader made by: csozi | Website: www.csozi.hu*/
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;

  .loader {
    width: 100%;
    max-width: 500px;
    height: auto;
    aspect-ratio: 374.9 / 351.8; /* Maintains original aspect ratio */
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo {
    fill: none;
    stroke-dasharray: 600px;
    /*<-- Play with this number until it look cool */
    stroke: hsl(var(--foreground));
    animation: load 8s infinite linear;
    stroke-width: 3px;
    width: 100%;
    height: 100%;
  }

  @keyframes load {
    0% {
      stroke-dashoffset: 0px;
    }

    100% {
      stroke-dashoffset: 6000px;
      /* <-- This number should always be 10 times the number up there*/
    }
  }
`;

export default RunnerLoader;
