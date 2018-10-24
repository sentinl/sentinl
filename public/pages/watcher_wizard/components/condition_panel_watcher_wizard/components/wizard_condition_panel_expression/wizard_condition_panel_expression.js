import { defaultsDeep, omit, isEqual, isEmpty, assign } from 'lodash';

import React, {
  PureComponent,
} from 'react';

import { render, unmountComponentAtNode } from 'react-dom';

import {
  EuiExpression,
  EuiExpressionButton,
  EuiPopoverTitle,
  EuiFlexItem,
  EuiFlexGroup,
  EuiPopover,
  EuiSelect,
  EuiFieldText,
  EuiFormRow,
  EuiFieldNumber
} from '@elastic/eui';

export default class WizardConditionPanelExpression extends PureComponent {
  constructor(props) {
    super(props);

    this.options = {
      queryType: [
        { value: 'count', text: 'count' },
        { value: 'average', text: 'average' },
        { value: 'sum', text: 'sum' },
        { value: 'min', text: 'min' },
        { value: 'max', text: 'max' },
      ],
      queryOver: [
        { value: 'all docs', text: 'all docs' },
        { value: 'top', text: 'top' },
      ],
      threshold: [
        { value: 'above', text: 'above' },
        { value: 'below', text: 'below' },
        { value: 'above eq', text: 'above eq' },
        { value: 'below eq', text: 'below eq' },
      ],
      interval: [
        { value: 'seconds', text: 'seconds' },
        { value: 'minutes', text: 'minutes' },
        { value: 'hours', text: 'hours' },
        { value: 'days', text: 'days' },
        { value: 'month', text: 'months' },
        { value: 'years', text: 'years' },
      ],
    };

    this.state = {
      currentlyOpenPopover: undefined
    };
  }

  _limitText(text = '', charLimit = 10) {
    return text.length > charLimit ? text.substring(0, charLimit - 1) + '...' : text;
  }

  get aggOnFieldEnabled() {
    return this.props.chartQueryParams.queryType !== 'count';
  }

  get popoverBtnValueQueryAggField() {
    if (this.aggOnFieldEnabled) {
      return `date: ${this._limitText(this.props.chartQueryParams.timeField)},` +
        ` field: ${this._limitText(this.props.chartQueryParams.field)}`;
    }
    return `date: ${this._limitText(this.props.chartQueryParams.timeField)}`;
  }

  get popoverBtnValueQueryOver() {
    if (this.props.chartQueryParams.over.type === 'top') {
      return `${this.props.chartQueryParams.over.type} ${this.props.chartQueryParams.over.n} ` +
        this._limitText(this.props.chartQueryParams.over.field);
    }
    return this.props.chartQueryParams.over.type;
  }

  getOptionsFromArr = (arr) => arr.map(o => ({text: o, value: o}))

  openQueryType = () => this.setState({ currentlyOpenPopover: 'queryType' })

  closeQueryType = () => this.state.currentlyOpenPopover === 'queryType' && this.setState({ currentlyOpenPopover: undefined })

  openQueryAggField = () => this.setState({ currentlyOpenPopover: 'queryAggField' })

  closeQueryAggField = () => this.state.currentlyOpenPopover === 'queryAggField' && this.setState({ currentlyOpenPopover: undefined })

  openQueryOver = () => this.setState({ currentlyOpenPopover: 'queryOver' })

  closeQueryOver = () => this.state.currentlyOpenPopover === 'queryOver' && this.setState({ currentlyOpenPopover: undefined })

  openQueryThreshold = () => this.setState({ currentlyOpenPopover: 'queryThreshold' })

  closeQueryThreshold = () => this.state.currentlyOpenPopover === 'queryThreshold' && this.setState({ currentlyOpenPopover: undefined })

  openQueryLast = () => this.setState({ currentlyOpenPopover: 'queryLast' })

  closeQueryLast = () => this.state.currentlyOpenPopover === 'queryLast' && this.setState({ currentlyOpenPopover: undefined })

  openQueryInterval = () => this.setState({ currentlyOpenPopover: 'queryInterval' })

  closeQueryInterval = () => this.state.currentlyOpenPopover === 'queryInterval' && this.setState({ currentlyOpenPopover: undefined })

  changeQueryType = (event) => {
    let field = event.target.value !== 'count' ? this.props.chartQueryParams.field : undefined;

    if (this.props.indexNumericFields.length && !this.props.indexNumericFields.includes(field) && event.target.value !== 'count') {
      field = this.props.indexNumericFields[0];
    }

    this._updateQueryType(event.target.value, field);
  }

  changeQueryAggDateField = (event) => this._updateQueryAgg({ timeField: event.target.value })

  changeQueryAggNumField = (event) => this._updateQueryAgg({ field: event.target.value })

  changeQueryOverType = (event) => {
    let params = { type: event.target.value };

    if (event.target.value === 'top' && this.props.indexTextFields.length) {
      assign(params, { n: 3, field: this.props.indexTextFields[0] });
    }

    this._updateQueryOver(params);
  }

  changeQueryOverTopField = (event) => this._updateQueryOver({ field: event.target.value })

  changeQueryOverTopN = (event) => this._updateQueryOver({ n: +event.target.value })

  changeQueryThresholdDirection = (event) => this._updateQueryThreshold({ direction: event.target.value });

  changeQueryThresholdN = (event) => this._updateQueryThreshold({ n: +event.target.value })

  changeQueryLastUnit = (event) => this._updateQueryLast({ unit: event.target.value })

  changeQueryLastN = (event) => this._updateQueryLast({ n: +event.target.value })

  changeQueryIntervalUnit = (event) => this._updateQueryInterval({ unit: event.target.value })

  changeQueryIntervalN = (event) => this._updateQueryInterval({ n: +event.target.value })

  _updateQueryType = (queryType, field) => {
    let params;

    if (!field) {
      params = defaultsDeep({ queryType }, omit(this.props.chartQueryParams, ['field']));
    } else {
      params = defaultsDeep({ field, queryType }, this.props.chartQueryParams);
    }

    this.props.onChange(params);
  }

  _updateQueryAgg = (fields) => {
    this.props.onChange(defaultsDeep(fields, this.props.chartQueryParams));
  }

  _updateQueryOver = (over) => {
    this.props.onChange(defaultsDeep({ over }, this.props.chartQueryParams));
  }

  _updateQueryThreshold = (threshold) => {
    this.props.onChange(defaultsDeep({ threshold }, this.props.chartQueryParams));
  }

  _updateQueryLast = (last) => {
    this.props.onChange(defaultsDeep({ last }, this.props.chartQueryParams));
  }

  _updateQueryInterval = (interval) => {
    this.props.onChange(defaultsDeep({ interval }, this.props.chartQueryParams));
  }

  renderQueryTypePopover() {
    return (
      <div className="expression-popover">
        <EuiPopoverTitle>When</EuiPopoverTitle>
        <EuiExpression style={{ width: 180 }}>
          <EuiSelect
            value={this.props.chartQueryParams.queryType}
            onChange={this.changeQueryType}
            options={this.options.queryType}
          />
        </EuiExpression>
      </div>
    );
  }

  renderQueryAggFieldPopover() {
    return (
      <div className="expression-popover">
        <EuiPopoverTitle>Agg</EuiPopoverTitle>
        <EuiExpression>
          <EuiFlexGroup style={{ maxWidth: 600 }}>
            <EuiFlexItem grow={false} style={{ width: 180 }}>
              <EuiSelect
                value={this.props.chartQueryParams.timeField}
                onChange={this.changeQueryAggDateField}
                options={this.getOptionsFromArr(this.props.indexDateFields)}
              />
            </EuiFlexItem>

            {this.aggOnFieldEnabled && <EuiFlexItem grow={false} style={{ width: 180 }}>
              <EuiSelect
                value={this.props.chartQueryParams.field}
                onChange={this.changeQueryAggNumField}
                options={this.getOptionsFromArr(this.props.indexNumericFields)}
              />
            </EuiFlexItem>}
          </EuiFlexGroup>
        </EuiExpression>
      </div>
    );
  }

  renderQueryOverPopover() {
    return (
      <div className="expression-popover">
        <EuiPopoverTitle>Is over</EuiPopoverTitle>
        <EuiExpression>
          <EuiFlexGroup style={{ maxWidth: 600 }}>
            <EuiFlexItem grow={false} style={{ width: 100 }}>
              <EuiSelect
                value={this.props.chartQueryParams.over.type}
                onChange={this.changeQueryOverType}
                options={this.options.queryOver}
              />
            </EuiFlexItem>

            {this.props.chartQueryParams.over.type === 'top' && <EuiFlexItem grow={false} style={{ width: 180 }}>
              <EuiFieldNumber
                placeholder="N of buckets"
                value={this.props.chartQueryParams.over.n}
                onChange={this.changeQueryOverTopN}
              />
            </EuiFlexItem>}

            {this.props.chartQueryParams.over.type === 'top' && <EuiFlexItem grow={false} style={{ width: 180 }}>
              <EuiSelect
                value={this.props.chartQueryParams.over.field}
                onChange={this.changeQueryOverTopField}
                options={this.getOptionsFromArr(this.props.indexTextFields)}
              />
            </EuiFlexItem>}
          </EuiFlexGroup>
        </EuiExpression>
      </div>
    );
  }

  renderQueryThresholdPopover() {
    return (
      <div className="expression-popover">
        <EuiPopoverTitle>Is</EuiPopoverTitle>
        <EuiExpression>
          <EuiFlexGroup style={{ maxWidth: 600 }}>
            <EuiFlexItem grow={false} style={{ width: 180 }}>
              <EuiSelect
                value={this.props.chartQueryParams.threshold.direction}
                onChange={this.changeQueryThresholdDirection}
                options={this.options.threshold}
              />
            </EuiFlexItem>

            <EuiFlexItem grow={false} style={{ width: 180 }}>
              <EuiFieldNumber
                placeholder="N of buckets"
                value={this.props.chartQueryParams.threshold.n}
                onChange={this.changeQueryThresholdN}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiExpression>
      </div>
    );
  }

  renderQueryLastPopover() {
    return (
      <div className="expression-popover">
        <EuiPopoverTitle>Last</EuiPopoverTitle>
        <EuiExpression>
          <EuiFlexGroup style={{ maxWidth: 600 }}>
            <EuiFlexItem grow={false} style={{ width: 180 }}>
              <EuiSelect
                value={this.props.chartQueryParams.last.unit}
                onChange={this.changeQueryLastUnit}
                options={this.options.interval}
              />
            </EuiFlexItem>

            <EuiFlexItem grow={false} style={{ width: 180 }}>
              <EuiFieldNumber
                placeholder="N of buckets"
                value={this.props.chartQueryParams.last.n}
                onChange={this.changeQueryLastN}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiExpression>
      </div>
    );
  }

  renderQueryIntervalPopover() {
    return (
      <div className="expression-popover">
        <EuiPopoverTitle>Interval</EuiPopoverTitle>
        <EuiExpression>
          <EuiFlexGroup style={{ maxWidth: 600 }}>
            <EuiFlexItem grow={false} style={{ width: 180 }}>
              <EuiSelect
                value={this.props.chartQueryParams.interval.unit}
                onChange={this.changeQueryIntervalUnit}
                options={this.options.interval}
              />
            </EuiFlexItem>

            <EuiFlexItem grow={false} style={{ width: 180 }}>
              <EuiFieldNumber
                placeholder="N of buckets"
                value={this.props.chartQueryParams.interval.n}
                onChange={this.changeQueryIntervalN}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiExpression>
      </div>
    );
  }

  render() {
    return (
      <EuiFlexGroup gutterSize="m">
        <EuiFlexItem grow={false}>
          <EuiPopover
            id="query_type_popover"
            button={(
              <EuiExpressionButton
                description="when"
                buttonValue={this.props.chartQueryParams.queryType}
                isActive={this.state.currentlyOpenPopover === 'queryType'}
                onClick={this.openQueryType}
              />
            )}
            isOpen={this.state.currentlyOpenPopover === 'queryType'}
            closePopover={this.closeQueryType}
            panelPaddingSize="none"
            ownFocus
            withTitle
            anchorPosition="downLeft"
          >
            {this.renderQueryTypePopover()}
          </EuiPopover>
        </EuiFlexItem>

        <EuiFlexItem grow={false}>
          <EuiPopover
            id="query_agg_field_popover"
            button={(
              <EuiExpressionButton
                description="Agg"
                buttonValue={this.popoverBtnValueQueryAggField}
                isActive={this.state.currentlyOpenPopover === 'queryAggField'}
                onClick={this.openQueryAggField}
              />
            )}
            isOpen={this.state.currentlyOpenPopover === 'queryAggField'}
            closePopover={this.closeQueryAggField}
            panelPaddingSize="none"
            ownFocus
            withTitle
            anchorPosition="downLeft"
          >
            {this.renderQueryAggFieldPopover()}
          </EuiPopover>
        </EuiFlexItem>

        <EuiFlexItem grow={false}>
          <EuiPopover
            id="query_over_docs_popover"
            button={(
              <EuiExpressionButton
                description="Is over"
                buttonValue={this.popoverBtnValueQueryOver}
                isActive={this.state.currentlyOpenPopover === 'queryOver'}
                onClick={this.openQueryOver}
              />
            )}
            isOpen={this.state.currentlyOpenPopover === 'queryOver'}
            closePopover={this.closeQueryOver}
            panelPaddingSize="none"
            ownFocus
            withTitle
            anchorPosition="downLeft"
          >
            {this.renderQueryOverPopover()}
          </EuiPopover>
        </EuiFlexItem>

        <EuiFlexItem grow={false}>
          <EuiPopover
            id="query_threshold_popover"
            button={(
              <EuiExpressionButton
                description="Is"
                buttonValue={`${this.props.chartQueryParams.threshold.direction} ${this.props.chartQueryParams.threshold.n}`}
                isActive={this.state.currentlyOpenPopover === 'queryThreshold'}
                onClick={this.openQueryThreshold}
              />
            )}
            isOpen={this.state.currentlyOpenPopover === 'queryThreshold'}
            closePopover={this.closeQueryThreshold}
            panelPaddingSize="none"
            ownFocus
            withTitle
            anchorPosition="downLeft"
          >
            {this.renderQueryThresholdPopover()}
          </EuiPopover>
        </EuiFlexItem>

        <EuiFlexItem grow={false}>
          <EuiPopover
            id="query_last_popover"
            button={(
              <EuiExpressionButton
                description="Last"
                buttonValue={`${this.props.chartQueryParams.last.unit} ${this.props.chartQueryParams.last.n}`}
                isActive={this.state.currentlyOpenPopover === 'queryLast'}
                onClick={this.openQueryLast}
              />
            )}
            isOpen={this.state.currentlyOpenPopover === 'queryLast'}
            closePopover={this.closeQueryLast}
            panelPaddingSize="none"
            ownFocus
            withTitle
            anchorPosition="downLeft"
          >
            {this.renderQueryLastPopover()}
          </EuiPopover>
        </EuiFlexItem>

        <EuiFlexItem grow={false}>
          <EuiPopover
            id="query_interval_popover"
            button={(
              <EuiExpressionButton
                description="Interval"
                buttonValue={`${this.props.chartQueryParams.interval.unit} ${this.props.chartQueryParams.interval.n}`}
                isActive={this.state.currentlyOpenPopover === 'queryInterval'}
                onClick={this.openQueryInterval}
              />
            )}
            isOpen={this.state.currentlyOpenPopover === 'queryInterval'}
            closePopover={this.closeQueryInterval}
            panelPaddingSize="none"
            ownFocus
            withTitle
            anchorPosition="downLeft"
          >
            {this.renderQueryIntervalPopover()}
          </EuiPopover>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }
}
