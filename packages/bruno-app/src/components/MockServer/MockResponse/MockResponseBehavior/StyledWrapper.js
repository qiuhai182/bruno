import styled from 'styled-components';

const StyledWrapper = styled.div`
  padding: 0.5rem 1rem;
  border-bottom: 1px solid ${(props) => props.theme.border.border0};
  background: ${(props) => props.theme.bg.app};
  font-size: 0.75rem;

  ${(props) => props.editMode === false && `
    opacity: 0.6;
  `}

  .behavior-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: flex-end;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  label > span {
    color: ${(props) => props.theme.colors.text.muted};
  }

  input[type='text'] {
    width: 6.5rem;
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: 3px;
    background: ${(props) => props.theme.input.bg};
    color: ${(props) => props.theme.text};
    padding: 0.2rem 0.4rem;
    outline: none;
  }

  .checkbox-label {
    flex-direction: row !important;
    align-items: center;
    gap: 0.4rem !important;
  }

  .extract-section {
    margin-top: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .extract-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: ${(props) => props.theme.colors.text.muted};
  }

  .extract-row {
    display: flex;
    gap: 0.35rem;
    align-items: center;
  }

  .extract-row select,
  .extract-row input {
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: 3px;
    background: ${(props) => props.theme.input.bg};
    color: ${(props) => props.theme.text};
    padding: 0.2rem 0.4rem;
    outline: none;
  }

  .extract-row select {
    width: 6rem;
  }

  .extract-row input {
    width: 12rem;
  }

  button {
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: 3px;
    background: transparent;
    color: ${(props) => props.theme.text};
    padding: 0.1rem 0.4rem;
    cursor: pointer;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export default StyledWrapper;
