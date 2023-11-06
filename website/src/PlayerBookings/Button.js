import styled from "@emotion/styled";

export const Button = styled.button`
  margin: 0 5px;
  padding: 10px 15px;
  font-size: 1.2em;
  border: none;
  cursor: pointer;
  transition: color 0.3s;
  border-bottom: ${props => props.selected ? '3px solid #4A90E2' : 'none'};
  height: 75px;

  &:hover {
    color: #357ABD;
  }
`;