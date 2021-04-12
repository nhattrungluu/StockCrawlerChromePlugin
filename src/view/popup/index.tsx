import * as React from "react";
import "./style.scss";
import {
  generateClassNameBasedOnProfit,
  generateProfitText,
  getCurrentTimeChartLabel,
} from "./utils";
import AssetChart from "./components/AssetChart";
import { ChartData } from "./types";

type Stock = {
  quantity: number;
  originalPrice: number;
  price: number;
};

type StockMap = Record<string, Stock>;

type State = {
  stocks: StockMap;
  showNewStockInput: boolean;
  newStockQuantity: number;
  newStockName: string;
  editingQuantityStock: { stockName: string; quantity: number } | null;
  chartData: ChartData;
};

const MAX_ELEMENTS = 100;
class PopUp extends React.Component<any, State> {
  _changeListener: Object | null = null;
  constructor(props: any) {
    super(props);
    this.state = {
      stocks: {},
      newStockName: "",
      newStockQuantity: 0,
      showNewStockInput: false,
      editingQuantityStock: null,
      chartData: { data: [], time: [] },
    };
  }
  componentDidMount() {
    this._initStoredStock();
    document.addEventListener("keyup", this._onKeyUp);
    if (chrome && chrome.storage) {
      this._changeListener = chrome.storage.onChanged.addListener(
        (changes: { stocks: { oldValue: StockMap; newValue: StockMap } }) => {
          if (!!changes.stocks) {
            const newTotalValue = this._calculateTotal(changes.stocks.newValue);
            this.setState(({ chartData }) => {
              const { data, time } = chartData;
              const newData = [...data, newTotalValue];
              const newTime = [...time, getCurrentTimeChartLabel()];
              return {
                stocks: changes.stocks.newValue,
                chartData: {
                  data: newData.slice(
                    Math.max(newData.length - MAX_ELEMENTS, 0)
                  ),
                  time: newTime.slice(
                    Math.max(newData.length - MAX_ELEMENTS, 0)
                  ),
                },
              };
            }, this._syncWithChromeStorage);
          }
        }
      );
    }
  }

  componentWillUnmount() {
    if (chrome && chrome.storage) {
      chrome.storage.onChanged.removeListener(this._changeListener);
    }
    document.removeEventListener("keyup", this._onKeyUp);
  }

  _onKeyUp = (event: { keyCode: number }) => {
    if (event.keyCode === 13) {
      const { editingQuantityStock, newStockName } = this.state;
      if (!!editingQuantityStock) {
        this._onUpdateQuantitySubmit();
        return;
      }

      if (!!newStockName) {
        this._onNewStockSubmit();
      }
    }
  };

  _initStoredStock = () => {
    if (!chrome || !chrome.storage) {
      return;
    }
    chrome.storage.sync.get(
      ["stocks", "chartData"],
      ({ stocks, chartData }: { stocks?: StockMap; chartData?: ChartData }) => {
        if (!!stocks || !!chartData) {
          //console.log("chartData", chartData);
          this.setState(
            ({
              stocks: currentStockDataInState,
              chartData: currentChartDataInState,
            }) => {
              return {
                stocks: { ...currentStockDataInState, ...stocks },
                chartData: !!chartData ? chartData : currentChartDataInState,
              };
            }
          );

          return null;
        }
      }
    );
  };

  _onAddStockButtonPress = () => {
    this.setState(({ showNewStockInput }) => ({
      showNewStockInput: !showNewStockInput,
    }));
  };

  _onTextChange = (event: {
    target: {
      name: string;
      value: string;
    };
  }) => {
    const { value, name } = event.target;
    {
      // @ts-expect-error already check value above
      this.setState({
        [name]:
          name === "newStockQuantity"
            ? Math.max(0, !!value ? parseInt(value) : 0)
            : value.toUpperCase(),
      });
    }
  };

  _onNewQuantityChange = (event: {
    target: {
      name: string;
      value: string;
    };
  }) => {
    const { value } = event.target;
    this.setState(({ editingQuantityStock }) =>
      editingQuantityStock
        ? {
            editingQuantityStock: {
              ...editingQuantityStock,
              quantity: Math.max(0, Math.max(0, !!value ? parseInt(value) : 0)),
            },
          }
        : null
    );
  };

  _syncWithChromeStorage = () => {
    if (!!chrome && chrome.storage) {
      chrome.storage.sync.set({
        stocks: this.state.stocks,
        chartData: this.state.chartData,
      });
    }
  };

  _onUpdateQuantitySubmit = () => {
    const { editingQuantityStock } = this.state;
    if (!editingQuantityStock) {
      return;
    }

    const { stockName, quantity } = editingQuantityStock;

    this.setState(
      ({ stocks }) => ({
        stocks: {
          ...stocks,
          [stockName]: {
            ...stocks[stockName],
            quantity,
          },
        },
        editingQuantityStock: null,
      }),
      this._syncWithChromeStorage
    );
  };

  _onRemoveStock = (stockName: string) => {
    if (window.confirm(`Are u sure to delete ${stockName}`)) {
      const clonedStocks = { ...this.state.stocks };
      delete clonedStocks[stockName];
      this.setState(
        {
          stocks: clonedStocks,
        },
        this._syncWithChromeStorage
      );
    }
  };

  _onNewStockSubmit = () => {
    const { newStockName, newStockQuantity } = this.state;
    if (!!newStockName && !!newStockQuantity && newStockQuantity > 0) {
      this.setState(
        ({ stocks }) => ({
          stocks: {
            ...stocks,
            [newStockName]: {
              quantity: newStockQuantity,
              originalPrice: 0,
              price: 0,
            },
          },
          showNewStockInput: false,
        }),
        this._syncWithChromeStorage
      );
    }
  };

  _calculateTotal = (stocks: StockMap = this.state.stocks) => {
    return Math.round(
      Object.keys(stocks).reduce((previousVal, stockName) => {
        const currentStock = stocks[stockName];
        const { quantity, price } = currentStock;
        return previousVal + quantity * price;
      }, 0)
    );
  };

  render() {
    const {
      stocks,
      showNewStockInput,
      newStockName,
      newStockQuantity,
      editingQuantityStock,
      chartData,
    } = this.state;
    return (
      <div className="popupContainer">
        <p>Vietnam Stock Manager inda house !!!</p>
        <p> Unit : 000 VND </p>
        <table className="container">
          <thead>
            <tr>
              <th>
                <h1>Stock</h1>
              </th>
              <th>
                <h1>Today Open Price </h1>
              </th>
              <th>
                <h1>Current Price</h1>
              </th>
              <th>
                <h1>Quantity</h1>
              </th>
              <th>
                <h1>Current Value</h1>
              </th>
              <th>
                <h1>Daily Change</h1>
              </th>
              <th>
                <h1>Action</h1>
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(stocks).map((name: string) => {
              const stock = stocks[name];
              if (!stock) {
                return null;
              }

              const { quantity, originalPrice, price } = stock;
              const currentValue = quantity * price;
              const initPrice = originalPrice * quantity;
              const profit = currentValue - initPrice;
              const isEditingQuantityStockActive =
                !!editingQuantityStock &&
                editingQuantityStock.stockName === name;
              const displayingQuantity = isEditingQuantityStockActive
                ? // @ts-expect-error check null already
                  editingQuantityStock.quantity
                : quantity;
              return (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{originalPrice}</td>
                  <td>{price}</td>
                  <td className="editable">
                    <input
                      type="number"
                      value={displayingQuantity}
                      onFocus={() => {
                        this.setState({
                          editingQuantityStock: { stockName: name, quantity },
                        });
                      }}
                      onBlur={() => {
                        this.setState({ editingQuantityStock: null });
                      }}
                      onChange={this._onNewQuantityChange}
                    />
                    {isEditingQuantityStockActive && (
                      <i
                        className="fa fa-check"
                        aria-hidden="true"
                        onMouseDown={this._onUpdateQuantitySubmit}
                      />
                    )}
                  </td>
                  <td>{Math.round(currentValue)}</td>
                  <td className={generateClassNameBasedOnProfit(profit)}>
                    {generateProfitText(profit)}
                  </td>
                  <td>
                    <i
                      className="fa fa-window-close"
                      aria-hidden="true"
                      onClick={() => this._onRemoveStock(name)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p>{`Total : ${this._calculateTotal()}`}</p>
        <div className="button" onClick={this._onAddStockButtonPress}>
          Click Here To Add New Stock
        </div>
        {showNewStockInput && (
          <div>
            <div className="stockRowContainer">
              <p>Name: </p>
              <input
                className="stockRowContainer__textInput"
                name="newStockName"
                value={newStockName}
                onChange={this._onTextChange}
              />
              <p>Quantity: </p>
              <input
                className="stockRowContainer__textInput"
                name="newStockQuantity"
                value={newStockQuantity}
                type="number"
                onChange={this._onTextChange}
              />
            </div>
            <div className="button" onClick={this._onNewStockSubmit}>
              Click Here To Submit
            </div>
          </div>
        )}
        <AssetChart chartData={chartData} />
      </div>
    );
  }
}

export default PopUp;
