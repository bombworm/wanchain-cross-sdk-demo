import React from 'react';
import logo from './logo.svg';
import './App.css';

const { WanBridge } = require('wanchain-cross-sdk');

const iwanAuth = {
  apiKey: "dd5dceb07ae111aaa2693ccaef4e5f049d0b2bc089bee2adbf0509531f867f59",
  secretKey: "4928108949fa444f127198acbd2a89baa9d57a0a618794cb7a2fe12986b52c04"
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      assetPairs: [],
      pairIndex: 0,
      asset: '',
      receiver: '',
      amount: '0',
      message: ""
    }
    this.bridge = new WanBridge("testnet");
    this.bridge.on("ready", assetPairs => {
      this.setState({assetPairs, asset: assetPairs.length? assetPairs[0].assetType : ''});
    }).on("error", info => {
      this.setState({message: "error: " + JSON.stringify(info)});
    }).on("account", info => {
      this.setState({message: "account: " + JSON.stringify(info)});
    }).on("ota", info => {
      this.setState({message: "ota: " + JSON.stringify(info)});
    }).on("lock", info => {
      this.setState({message: "lock: " + JSON.stringify(info)});
    }).on("redeem", info => {
      this.setState({message: "redeem: " + JSON.stringify(info)});
    });
  }

  async componentDidMount() {
    await this.bridge.init(iwanAuth);
  }

  async collectWallet() {
    return this.bridge.connectMetaMask();
  }

  async deposit() {
    let assetPair = this.state.assetPairs[this.state.pairIndex];
    try {
      let account = this.bridge.getWalletAccount(assetPair, "mint");
      console.log({account});
      let balance = await this.bridge.getAccountAsset(assetPair, "mint", account);
      console.log({balance});
      // TODO: check balance
      let fee = await this.bridge.estimateFee(assetPair, "mint");
      // TODO: accept fee or cancel the task
      console.log({fee});
      let task = await this.bridge.createTask(assetPair, 'mint', this.state.amount, '0x9D54FB4a5e5467CF3DBc904bcABD5EFC38b76344');
      await task.init();
      task.start();
      this.setState({message: "start deposit task " + task.id});
    } catch(err) {
      this.setState({message: err});
    }
  }

  async withdraw() {
    let assetPair = this.state.assetPairs[this.state.pairIndex];
    try {
      let account = this.bridge.getWalletAccount(assetPair, "burn");
      console.log({account});
      let balance = await this.bridge.getAccountAsset(assetPair, "burn", account);
      console.log({balance});
      // TODO: check balance
      let fee = await this.bridge.estimateFee(assetPair, "burn");
      console.log({fee});
      // TODO: accept fee or cancel the task
      let task = await this.bridge.createTask(assetPair, 'burn', this.state.amount, '0x9D54FB4a5e5467CF3DBc904bcABD5EFC38b76344');
      task.start();
      this.setState({message: "start withdraw task " + task.id});
    } catch(err) {
      this.setState({message: err});
    }
  }

  onChangePair = event => {
    let pairIndex = event.target.value;
    this.setState({
      pairIndex,
      asset: this.state.assetPairs[pairIndex].assetType
    });
    console.log({pairIndex});
  }

  onChangeAmount = event => {
    let amount = event.target.value;
    this.setState({amount});
    console.log({amount});
  }

  onChangeReceiver = event => {
    let receiver = event.target.value;
    this.setState({receiver});
    console.log({receiver});
  }

  render = () => {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            WanBridge SDK demo
          </p>
          <p>
            assert pair:
            &nbsp;
            <select onChange={this.onChangePair}>
              {
                this.state.assetPairs.map((item, index) =>
                <option value={index} key={index}>
                {item.assetType + ": " + item.fromChainName + " <-> " + item.toChainName}
                </option>)
              }
            </select>
            &nbsp;&nbsp;
            <button onClick={() => this.collectWallet()}>Connect MetaMask</button>
          </p>
          <p>
            amount: <input type="text" value={this.state.amount} onChange={this.onChangeAmount}/>
            &nbsp;
            to: <input type="text" value={this.state.receiver} onChange={this.onChangeReceiver}/>
          </p>
          <p>
            &nbsp;&nbsp;
            <button onClick={() => this.deposit()}>Deposit {this.state.asset}</button>
            &nbsp;&nbsp;
            <button onClick={() => this.withdraw()}>Withdraw {this.state.asset}</button>
          </p>
          <p style={{color: "white"}}>{this.state.message}</p>
        </header>
      </div>
    );
  }
}

export default App;
