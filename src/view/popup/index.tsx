/*global chrome*/
import * as React from "react";
import "./style.scss";

// const ENUM_MARKET = {
//     HOSE: "hose",
//     HNX: "hnx",
//     UPCOM: "upcom",
// };
//;

// chrome.storage.onChanged.addListener((changes) => {
//     const storageChange = changes["color"];
//     if (!storageChange) {
//         return;
//     }
//     console.log("hereee");
//     updateActiveTabColor();
// });
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
};

class PopUp extends React.Component<any, State> {
  state = {
    stocks: {},
    newStockName: "",
    newStockQuantity: 0,
    showNewStockInput: false,
  };
  componentDidMount() {
    this._initStoredStock();
  }

  _initStoredStock = () => {
    // @ts-expect-error
    if (!chrome || !chrome.storage) {
      return;
    }
    // @ts-expect-error
    chrome.storage.sync.get("stocks", ({ stocks }: { stocks: StockMap }) => {
      if (!!stocks) {
        this.setState(({ stocks: currentDataInState }) => ({
          stocks: { ...currentDataInState, ...stocks },
        }));
      }
    });
  };

  _onAddStockButtonPress = () => {
    this.setState({
      showNewStockInput: true,
    });
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
        [name]: name === "newStockQuantity" ? parseInt(value) : value,
      });
    }
  };

  _onSubmit = () => {
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
        () => {
          // @ts-expect-error
          if (!!chrome && chrome.storage) {
            // @ts-expect-error
            chrome.storage.sync.set({ stocks: this.state.stocks });
          }
        }
      );
    }
  };

  render() {
    const {
      stocks,
      showNewStockInput,
      newStockName,
      newStockQuantity,
    } = this.state;
    return (
      <div className="popupContainer">
        <p>FOMO Crawler inda house !!!</p>
        {Object.keys(stocks).map((name: string) => {
          // @ts-expect-error as it thinks state is constant
          const stock = stocks[name];
          if (!stock) {
            return;
          }

          const { quantity, originalPrice, price } = stock;
          return (
            <div key={name} className="stockRowContainer">
              <div className="stockRowContainer__column">{name}</div>
              <div className="stockRowContainer__column">{originalPrice}</div>
              <div className="stockRowContainer__column">{price}</div>
              <div className="stockRowContainer__column">{quantity}</div>
            </div>
          );
        })}
        <div className="button" onClick={this._onAddStockButtonPress}>
          Click Here To Add New Stock To Watch
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
            <div className="button" onClick={this._onSubmit}>
              Click Here To Submit
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default PopUp;
