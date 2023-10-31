import styled from '@emotion/styled';
import {css} from "@emotion/react";

export const Spinner = styled.div`
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 4px solid #fff;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
  display: inline-block; // To display it inline with text

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
