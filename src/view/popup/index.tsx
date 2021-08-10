import * as React from "react";
import "./style.scss";
import {generateClassNameBasedOnProfit, generateProfitText} from "./utils";
import AssetChart from "./components/AssetChart";
import {ChartData} from "./types";
import {Modal} from "./components/Modal";

type Stock = {
    quantity: number;
    originalPrice: number;
    price: number;
};

type StockMap = Record<string, Stock>;

type State = {
    stocks: StockMap;
    showNewStockInput: boolean;
    editingQuantityStock: { stockName: string; quantity: string } | null;
    chartData: ChartData;
    removingStockName: string | null,
};

class PopUp extends React.Component<any, State> {
    _changeListener: Object | null = null;

    constructor(props: any) {
        super(props);
        this.state = {
            stocks: {},
            showNewStockInput: false,
            editingQuantityStock: null,
            chartData: {data: [], time: []},
            removingStockName: null,
        };
    }

    componentDidMount() {
        /**
         * Temporary workaround for secondary monitors on MacOS where redraws don't happen
         * @See https://bugs.chromium.org/p/chromium/issues/detail?id=971701
         */
        if (
            // From testing the following conditions seem to indicate that the popup was opened on a secondary monitor
            window.screenLeft < 0 ||
            window.screenTop < 0 ||
            window.screenLeft > window.screen.width ||
            window.screenTop > window.screen.height
        ) {
            chrome.runtime.getPlatformInfo(function (info: { os: string }) {
                    if (info.os !== 'mac') {
                        return;
                    }
                    const fontFaceSheet = new CSSStyleSheet()
                    fontFaceSheet.insertRule(`
        @keyframes redraw {
          0% {
            opacity: 1;
          }
          100% {
            opacity: .99;
          }
        }
      `)
                    fontFaceSheet.insertRule(`
        html {
          animation: redraw 1s linear infinite;
        }
      `)
                    //@ts-expect-error
                    document.adoptedStyleSheets = [...document.adoptedStyleSheets, fontFaceSheet]
                }
            )
        }

        if (chrome && chrome.runtime) {
            chrome.runtime.sendMessage({type: "REFRESH_IFRAME"});
        }

        this._initStoredStock();
        document.addEventListener("keyup", this._onKeyUp);
        if (chrome && chrome.storage) {
            this._changeListener = chrome.storage.onChanged.addListener(
                (changes: {
                    stocks: { oldValue: StockMap; newValue: StockMap };
                    chartData: { oldValue: ChartData; newValue: ChartData };
                }) => {
                    const {stocks, chartData} = changes;
                    if (!stocks && !chartData) {
                        return;
                    }
                    const newUpdatedData = {
                        ...(stocks?.newValue && {
                            stocks: stocks?.newValue,
                        }),
                        ...(chartData?.newValue && {
                            chartData: chartData?.newValue,
                        }),
                    };
                    this.setState(newUpdatedData);
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
            const {editingQuantityStock} = this.state;
            if (!!editingQuantityStock) {
                this._onUpdateQuantitySubmit();
                return;
            }
        }
    };

    _initStoredStock = () => {
        if (!chrome || !chrome.storage) {
            return;
        }
        chrome.storage.sync.get(
            ["stocks", "chartData"],
            ({stocks, chartData}: { stocks?: StockMap; chartData?: ChartData }) => {
                if (!!stocks || !!chartData) {
                    this.setState(
                        ({
                             stocks: currentStockDataInState,
                             chartData: currentChartDataInState,
                         }) => {
                            return {
                                stocks: {...currentStockDataInState, ...stocks},
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
        this.setState(({showNewStockInput}) => ({
            showNewStockInput: !showNewStockInput,
        }));
    };

    _onNewQuantityChange = (event: {
        target: {
            name: string;
            value: string;
        };
    }) => {
        const {value, name} = event.target;
        this.setState({
            editingQuantityStock: {
                stockName: name,
                quantity: value,
            },
        });
    };

    _syncWithChromeStorage = () => {
        if (!!chrome && chrome.storage) {
            chrome.storage.sync.set({
                stocks: this.state.stocks,
            });
        }
    };

    _onUpdateQuantitySubmit = () => {
        const {editingQuantityStock} = this.state;
        if (!editingQuantityStock) {
            return;
        }

        const {stockName, quantity} = editingQuantityStock;
        try {
            const parsedIntQuantity = parseInt(quantity)
            this.setState(
                ({stocks}) => ({
                    stocks: {
                        ...stocks,
                        [stockName]: {
                            ...stocks[stockName],
                            quantity: parsedIntQuantity || 0,
                        },
                    },
                    editingQuantityStock: null,
                }),
                this._syncWithChromeStorage
            );
        } catch {
            return;
        }
    };

    _onRemoveStock = (removingStockName: string) => {
        this.setState({
            removingStockName,
        })
    }

    _removeStock = () => {
        this.setState(({
                           removingStockName
                       }) => {
                if (!removingStockName) {
                    return null;
                }

                const clonedStocks = {...this.state.stocks};
                delete clonedStocks[removingStockName];
                return {
                    stocks: clonedStocks,
                    removingStockName: null
                };
            }, this._syncWithChromeStorage
        )
    }

    _onCloseRemoveStockDialog = () => {
        this.setState({
            removingStockName: null
        })
    }

    _onNewStockSubmit = (newStockName: string, newStockQuantity: string) => {
        try {
            const parsedIntQuantity = parseInt(newStockQuantity)
            if (!!newStockName && !!parsedIntQuantity && parsedIntQuantity > 0) {
                this.setState(
                    ({stocks}) => ({
                        stocks: {
                            ...stocks,
                            [newStockName]: {
                                quantity: parsedIntQuantity,
                                originalPrice: 0,
                                price: 0,
                            },
                        },
                        showNewStockInput: false,
                    }),
                    this._syncWithChromeStorage
                );
            }
        } catch {
            return;
        }
    };


    render() {
        const {
            stocks,
            showNewStockInput,
            editingQuantityStock,
            chartData,
            removingStockName,
        } = this.state;
        console.log('this.state', this.state)
        return (
            <div className="popupContainer">
                {!!removingStockName &&
                <Modal text="Are you sure ? " onClose={this._onCloseRemoveStockDialog} onConfirm={this._removeStock}/>}
                <h2 style={{paddingBottom: 0, fontWeight: "bold"}}>
                    Vietnam Stock Manager inda house !!!
                </h2>
                <h2 style={{paddingBottom: 0, fontWeight: "bold"}}>Unit: 000 VND</h2>
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

                        const {quantity, originalPrice, price} = stock;
                        const currentValue = quantity * price;
                        const initPrice = originalPrice * quantity;
                        const profit = currentValue - initPrice;
                        const isEditingQuantityStockActive =
                            !!editingQuantityStock &&
                            editingQuantityStock.stockName === name;
                        const displayingQuantity = isEditingQuantityStockActive
                            ? // @ts-expect-error check null already
                            editingQuantityStock.quantity || ""
                            : quantity;
                        return (
                            <tr key={name}>
                                <td>{name}</td>
                                <td>{originalPrice}</td>
                                <td>{price}</td>
                                <td className="editable">
                                    <input
                                        type="number"
                                        name={name}
                                        value={displayingQuantity}
                                        onFocus={() => {
                                            this.setState({
                                                editingQuantityStock: {stockName: name, quantity: quantity.toString()},
                                            });
                                        }}
                                        onBlur={() => {
                                            this.setState({editingQuantityStock: null});
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
                <div className="button" onClick={this._onAddStockButtonPress}>
                    Click Here To Add New Stock
                </div>
                {showNewStockInput && (
                    <NewStockInput onNewStockSubmit={this._onNewStockSubmit}/>
                )}
                <TotalAndProfit stockMap={this.state.stocks}/>
                <AssetChart chartData={chartData}/>
            </div>
        );
    }
}

const NewStockInput = ({onNewStockSubmit}: {
    onNewStockSubmit: (newStockName: string, newStockQuantity: string) => void
}) => {
    const [name, setName] = React.useState("");
    const [quantity, setQuantity] = React.useState("");
    React.useEffect(() => {
        const keyup = (event: { keyCode: number }) => {
            if (event.keyCode === 13) {
                onNewStockSubmit(name, quantity)
            }
        }
        document.addEventListener("keyup", keyup);
        return () => {
            document.removeEventListener("keyup", keyup)
        }
    });
    return <>
        <div className="stockRowContainer">
            <p className="stockRowContainer__rowTitle">Name: </p>
            <input
                className="stockRowContainer__textInput"
                value={name}
                onChange={(event: { target: { value: string } }) => {
                    setName(event.target.value.toUpperCase());
                }}
            />
            <p className="stockRowContainer__rowTitle">Quantity: </p>
            <input
                className="stockRowContainer__textInput"
                type="number"
                value={quantity}
                onChange={(event: { target: { value: string } }) => {
                    setQuantity(event.target.value);
                }}
            />
        </div>
        <div className="button" onClick={() => onNewStockSubmit(name, quantity)}>
            Click Here To Submit
        </div>
    </>
}

const calculateTotalAndProfit = (stockMap: StockMap) => {
    const total = Math.round(
        Object.keys(stockMap).reduce((previousVal, stockName) => {
            const currentStock = stockMap[stockName];
            const {quantity, price} = currentStock;
            return previousVal + quantity * price;
        }, 0)
    );
    const profit = total - Math.round(
        Object.keys(stockMap).reduce((previousVal, stockName) => {
            const currentStock = stockMap[stockName];
            const {quantity, originalPrice} = currentStock;
            return previousVal + quantity * originalPrice;
        }, 0)
    );
    return {total, profit};
};
const TotalAndProfit = React.memo(({stockMap}: { stockMap: StockMap }) => {
    const {total, profit} = calculateTotalAndProfit(stockMap);
    return <>
        <h2 className={`bold ${generateClassNameBasedOnProfit(profit)}`}>
            {`Profit : ${generateProfitText(profit)}`}
        </h2>
        <div className="line"/>
        <h1 className="bold">{`Total : ${total}`}</h1>
    </>
})

export default PopUp;
