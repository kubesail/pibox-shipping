import { useEffect, useState } from "react";
import "./App.css";
import Easypost from "@easypost/api";

const api = new Easypost("N/A", {
  baseUrl: `${window.origin}/v2/`,
});

const authorization = `Basic ${btoa(
  `${process.env.REACT_APP_KUBESAIL_PUBLIC_KEY}:${process.env.REACT_APP_KUBESAIL_SECRET_KEY}`
)}`;

// const PARCEL_HACKER_BUNDLE = "prcl_99744dbc8d67410d9ef83ce1539611a4"; // live
const PARCEL_HACKER_BUNDLE = "prcl_6b6e501acd2a4f59bca7ca303d9a40ee"; // test

let shipment;

function App() {
  const [active, setActive] = useState(null);
  const [rates, setRates] = useState([]);
  const [orders, setOrders] = useState([
    {
      backer_number: 1,
      backer_uid: 123456789,
      backer_name: "Adam Doyle",
      email: "adoyle88@gmail.com",
      shipping_country: "US",
      shipping_amount: "$0.00",
      reward_title: "Early Bird - Hacker Bundle",
      backing_minimum: "$50.00",
      reward_id: 8473311,
      bonus_support: "$0.00",
      pledge_amount: "$50.00",
      pledged_at: "2021/10/25, 13:17",
      fulfillment_status: "Not provided",
      pledged_status: "collected",
      notes: "",
      survey_response: "",
      first_name: "Adam",
      mi: "",
      last_name: "Doyle",
      company: "DF KitCar",
      address_1: "1225 Narrow Lane",
      address_2: "",
      address_3: "",
      city: "Red Oak",
      state_province: "TX",
      zip_postal_code: "75154",
      country: "US",
      urbanization: "",
      phone_number: "214-235-8818",
      fax_number: "",
      e_mail: "adoyle88@gmail.com",
      reference_number: "106005450",
      nickname: "1",
    },
    {
      backer_number: 3,
      backer_uid: 1992183902,
      backer_name: "Jim Dumser",
      email: "jimdumser@gmail.com",
      shipping_country: "US",
      shipping_amount: "$0.00",
      reward_title: "Early Bird - Hacker Bundle",
      backing_minimum: "$50.00",
      reward_id: 8473311,
      bonus_support: "$0.00",
      pledge_amount: "$50.00",
      pledged_at: "2021/10/25, 13:23",
      fulfillment_status: "Not provided",
      pledged_status: "collected",
      notes: "",
      survey_response: "",
    },
    {
      backer_number: 4,
      backer_uid: 1876102118,
      backer_name: "Timo",
      email: "timo@ribbers.com",
      shipping_country: "US",
      shipping_amount: "$0.00",
      reward_title: "Early Bird - Hacker Bundle",
      backing_minimum: "$50.00",
      reward_id: 8473311,
      bonus_support: "$0.00",
      pledge_amount: "$50.00",
      pledged_at: "2021/10/25, 13:28",
      fulfillment_status: "Not provided",
      pledged_status: "collected",
      notes: "",
      survey_response: "",
    },
    {
      backer_number: 8,
      backer_uid: 1876102148,
      backer_name: "Dan Pastusek",
      email: "timo@ribbers.com",
      shipping_country: "US",
      shipping_amount: "$0.00",
      reward_title: "Early Bird - Hacker Bundle",
      backing_minimum: "$50.00",
      reward_id: 8473311,
      bonus_support: "$0.00",
      pledge_amount: "$50.00",
      pledged_at: "2021/10/25, 13:28",
      fulfillment_status: "Not provided",
      pledged_status: "collected",
      notes: "",
      survey_response: "",
    },
  ]);

  // useEffect(async () => {
  //   const result = (
  //     await window.fetch("https://api.kubesail.com/admin/pibox/orders", {
  //       headers: {
  //         "content-type": "application/json",
  //         authorization,
  //       },
  //       method: "POST",
  //     })
  //   ).toJSON();
  //   setOrders(result.orders);
  // });

  useEffect(async () => {
    setRates([]);
    if (!activeOrder || !activeOrder?.address_1) return;

    if (activeOrder.shipment) {
      shipment = await api.Shipment.retrieve(activeOrder.shipment);
      setRates(shipment.rates);
      return;
    }
    // setCost(orders);

    shipment = await new api.Shipment({
      to_address: {
        company: activeOrder.company,
        street1: activeOrder.address_1,
        street2: activeOrder.address_2,
        city: activeOrder.city,
        state: activeOrder.state_province,
        zip: activeOrder.zip_postal_code,
        phone: activeOrder.phone_number,
      },
      from_address: {
        company: "KubeSail",
        street1: "1593 McAllister St",
        city: "San Francisco",
        state: "CA",
        zip: "94115",
        phone: "936-718-4259",
      },
      options: {
        print_custom_1: "KS-" + activeOrder.reference_number,
        print_custom_1_barcode: "KS-" + activeOrder.reference_number,
      },
      parcel: PARCEL_HACKER_BUNDLE,
    }).save();
    // TODO save shipment ID to kubesail API
    setRates(shipment.rates);
    setOrders(
      orders.map((order) =>
        order.backer_uid === active
          ? { ...order, shipment: shipment.id }
          : order
      )
    );
  }, [active]);

  const activeOrder = orders.find((order) => order.backer_uid === active);

  return (
    <div className="App">
      <header className="App-header">
        <p>📦 PiBox Shipping Station</p>
      </header>
      <div className="App-main">
        <section className="App-orders">
          <table>
            <thead>
              <tr>
                <th>Backer Number</th>
                <th>Name</th>
                <th>Country</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((row) => (
                <tr
                  className={active === row.backer_uid ? "active" : ""}
                  key={row.backer_uid}
                  onClick={() => setActive(row.backer_uid)}
                >
                  <td>{row.backer_number}</td>
                  <td>{row.backer_name}</td>
                  <td>{row.shipping_country}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="App-details">
          {activeOrder ? (
            <div>
              {activeOrder.shipment && <h2>{activeOrder.shipment}</h2>}
              <table>
                <tbody>
                  {activeOrder?.shipment?.postage_label ? (
                    <h2 style={{ color: "green" }}>✔ Shipped</h2>
                  ) : !activeOrder.address_1 ? (
                    <h2 style={{ color: "red" }}>Incomplete Address</h2>
                  ) : rates.length === 0 ? (
                    <h2>Fetching Rates...</h2>
                  ) : (
                    rates
                      .sort(function (a, b) {
                        if (parseInt(a.rate, 10) < parseInt(b.rate, 10))
                          return -1;
                        if (parseInt(a.rate, 10) > parseInt(b.rate, 10))
                          return 1;
                        return 0;
                      })
                      .map((rate) => (
                        <tr key={rate.id}>
                          <td>{rate.carrier}</td>
                          <td>{rate.service}</td>
                          <td>{rate.delivery_days}</td>
                          <td>${rate.rate}</td>
                          <td>
                            <button
                              style={{ padding: "2px 12px" }}
                              onClick={async () => {
                                const boughtShipment = await shipment.buy(
                                  rate.id
                                );
                                // TODO log shipment ID to kubesail API
                                fetch("/pibox/print-label", {
                                  method: "POST",
                                  body: JSON.stringify({
                                    url: boughtShipment.postage_label.label_url,
                                  }),
                                });
                                // window.open(
                                //   boughtShipment.postage_label.label_url,
                                //   "_blank"
                                // );
                                setRates([]);
                              }}
                            >
                              Buy Postage
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
              <hr />
              <table>
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(activeOrder).map((key) => (
                    <tr key={key}>
                      <td>{key}</td>
                      <td>{activeOrder[key]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            "No Order Selected"
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
