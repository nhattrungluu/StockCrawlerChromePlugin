import React from "react";
import {Line} from "react-chartjs-2";
import {ChartData} from "../../types";

const AssetChart = React.memo(({chartData}: { chartData: ChartData }) => {
    const {time, data} = chartData;

    return (
        <div>
            <Line
                height={300}
                width={600}
                data={{
                    labels: time,
                    datasets: [
                        {
                            label: "Money",
                            backgroundColor: "red",
                            borderColor: "red",
                            fill: false,
                            data,
                        },
                    ],
                }}
                options={{
                    title: {
                        display: true,
                        text: "Total Asset Valuation",
                        fontSize: 20,
                    },
                }}
            />
        </div>
    );
});

export default AssetChart;
