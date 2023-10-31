import styled from '@emotion/styled';

export const SaveButton = styled.button`
  background-color: #007BFF;
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  align-self: flex-end;
  margin-top: 25px;
  &:hover:not([disabled]) {
    background-color: #0056b3;
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.7; // Optional: reduce opacity when disabled to give a visual indication.
  }
`;