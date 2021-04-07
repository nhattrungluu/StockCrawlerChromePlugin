/*global chrome*/
import * as React from "react";
import logo from "../../logo.svg";
import "./App.css";

// const ENUM_MARKET = {
//     HOSE: "hose",
//     HNX: "hnx",
//     UPCOM: "upcom",
// };
//;
type Stock = {
  quantity: number;
  originalPrice: number;
  price: number;
};

type StockMap = Record<string, Stock>;

type State = {
  stocks: StockMap;
};

class App extends React.Component<any, State> {
  state = {
    stocks: {
      REE: { quantity: 6300, originalPrice: 0, price: 0 },
      ACB: { quantity: 6705, originalPrice: 0, price: 0 },
      STK: { quantity: 4400, originalPrice: 0, price: 0 },
      OCB: { quantity: 5000, originalPrice: 0, price: 0 },
      NTL: { quantity: 1800, originalPrice: 0, price: 0 },
    },
  };
  componentDidMount() {
    this._initStoredStock();
  }

  _initStoredStock = () => {
    // @ts-expect-error
    if (!chrome || !chrome.storage) {
      console.log("tach");
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

  render() {
    const { stocks } = this.state;
    console.log("this.state", this.state, stocks);
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>Hello This Is Stock Crawler</p>
          {Object.keys(stocks).map((name: string) => {
            if (typeof name !== "string") {
              return;
            }

              // @ts-expect-error as it thinks state is constant
              const stock = stocks[name];
            if (!stock) {
              return;
            }

            const { quantity, originalPrice, price } = stock;
            return (
              <div key={name} style={{ display: "flex", flexDirection: "row" }}>
                <div>{name}</div>
                <div>{originalPrice}</div>
                <div>{price}</div>
                <div>{quantity}</div>
              </div>
            );
          })}
          <div>Click Here To Add New Stock To Watch</div>
        </header>
      </div>
    );
  }
}

export default App;
