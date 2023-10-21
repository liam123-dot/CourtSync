import styled from '@emotion/styled';
import {css} from "@emotion/react";

export const Container = styled.div`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: #f4f4f4;
      padding: 30px;
      border-radius: 10px;
    `;

export const Form = styled.form`
      background-color: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
      width: 300px;
    `;

export const Input = styled.input`
      width: 100%;
      padding: 10px;
      margin-bottom: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
    `;

export const Button = styled.button`
      width: 100%;
      padding: 10px;
      background-color: #007bff;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
      }
    `;

export const titleStyle = css`
      margin-bottom: 20px;
      color: #333;
    `;

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
