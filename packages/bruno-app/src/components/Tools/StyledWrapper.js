import styled from 'styled-components';

const StyledWrapper = styled.div`
  height: 100%;
  overflow: auto;
  padding: 0.5rem;

  .tools-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
  }

  .tools-tabs button {
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: 3px;
    background: transparent;
    color: ${(props) => props.theme.text};
    font-size: 0.75rem;
    padding: 0.15rem 0.5rem;
    cursor: pointer;
  }

  .tools-tabs button.active {
    background: ${(props) => props.theme.background?.accent || 'rgba(127, 127, 127, 0.2)'};
  }

  .tool-body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.75rem;
  }

  .tool-body label {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .tool-body label > span {
    color: ${(props) => props.theme.colors?.text?.muted};
  }

  .tool-body label.grow {
    flex-grow: 1;
  }

  .tool-body input,
  .tool-body textarea,
  .tool-body select {
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: 3px;
    background: ${(props) => props.theme.input.bg};
    color: ${(props) => props.theme.text};
    padding: 0.25rem 0.4rem;
    outline: none;
    font-family: inherit;
  }

  .tool-body textarea {
    font-family: monospace;
    resize: vertical;
  }

  .tool-body button {
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: 3px;
    background: transparent;
    color: ${(props) => props.theme.text};
    font-size: 0.75rem;
    padding: 0.15rem 0.5rem;
    cursor: pointer;
    align-self: flex-start;
  }

  .tool-row {
    display: flex;
    gap: 0.5rem;
    align-items: flex-end;
  }

  .tool-row > button {
    align-self: auto;
  }

  .tool-line {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    justify-content: space-between;
  }

  .tool-line code {
    font-size: 0.7rem;
    word-break: break-all;
  }

  .tool-line .muted {
    color: ${(props) => props.theme.colors?.text?.muted};
  }

  .tool-error {
    color: ${(props) => props.theme.colors?.text?.danger || '#e74c3c'};
  }
`;

export default StyledWrapper;
