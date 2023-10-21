import styled from '@emotion/styled';

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

export const ModalContent = styled.div`
  background: white;
  padding: 30px; // Increased padding
  border-radius: 15px; // Bigger border-radius
  box-shadow: 0px 10px 20px 0px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 18px; // Bigger font size
`;