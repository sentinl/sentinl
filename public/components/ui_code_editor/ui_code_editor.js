import React, {
  PureComponent,
} from 'react';

import { render } from 'react-dom';

import 'brace/theme/github';
import 'brace/mode/javascript';
import 'brace/mode/json';
import 'brace/snippets/javascript';
import 'brace/snippets/json';
import 'brace/ext/language_tools';

import {
  EuiCodeEditor,
} from '@elastic/eui';

export default class UiCodeEditor extends PureComponent {
  constructor(props) {
    super(props);

    this.editor = {
      debounce: this.props.debounce || 1, // ms
    };

    this.state = {
      value: this.props.value,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      this.setState({ value: nextProps.value });
    }
  }

  onChange = (value) => {
    this.setState({ value });
    setTimeout(() => {
      this.props.onValueChange(value);
    }, this.editor.debounce);
  };

  render() {
    return (
      <EuiCodeEditor
        mode={this.props.mode}
        theme="github"
        width="100%"
        value={this.state.value}
        onChange={this.onChange}
        isReadOnly={this.props.isReadOnly}
        setOptions = {{
          rendererOptions: {
            maxLines: this.props.maxLines,
            minLines: this.props.minLines,
          },
          fontSize: '14px',
          enableBasicAutocompletion: true,
          enableSnippets: true,
          enableLiveAutocompletion: true,
        }}
      />
    );
  }
}
