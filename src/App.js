import React from 'react';
import logo from './logo.svg';
import './App.css';

import { WanBridge } from 'wanchain-cross-sdk'

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
      message: "",
      task: null
    }
    this.bridge = new WanBridge("testnet");
    this.bridge.on("ready", assetPairs => {
      let isReady = this.bridge.isReady();
      console.log({isReady});
      this.setState({assetPairs, asset: assetPairs.length? assetPairs[0].assetType : ''});
      let history = this.bridge.getHistory();
      console.log({history});
    }).on("error", info => {
      this.setState({message: "error: " + JSON.stringify(info)});
    }).on("account", info => {
      console.log("account event: %O", info);
      this.setState({message: "account: " + JSON.stringify(info)});
    }).on("ota", info => {
      this.setState({message: "ota: " + JSON.stringify(info)});
    }).on("lock", info => {
      this.setState({message: "lock: " + JSON.stringify(info)});
    }).on("redeem", info => {
      console.log("redeem event: %O", info);
      this.setState({message: "redeem: " + JSON.stringify(info)});
    });
  }

  async componentDidMount() {
    await this.bridge.init(iwanAuth);
  }

  async connectMetaMask() {
    try {
      let account = await this.bridge.connectMetaMask();
      console.log("connectMetaMask: %s", account);
    } catch(err) {
      console.error("connectMetaMask error: %O", err);
    }
  }

  async connectPolkadot() {
    try {
      let accounts = await this.bridge.connectPolkadot();
      console.log("connectPolkadot: %O", accounts);
    } catch(err) {
      console.error("connectPolkadot error: %O", err);
    }
  }

  async deposit() {
    let assetPair = this.state.assetPairs[this.state.pairIndex];
    console.log({assetPair});
    try {
      let account = this.bridge.getWalletAccount(assetPair, "mint");
      console.log({account});
      if (Array.isArray(account)) {
        account = account[0];
      }
      let balance = await this.bridge.getAccountAsset(assetPair, "mint", account);
      console.log({balance});
      // TODO: check balance
      let fee = await this.bridge.estimateFee(assetPair, "mint");
      console.log({fee});
      // TODO: accept fee or cancel the task
      let quota = await this.bridge.getQuota(assetPair, "mint");
      console.log({quota});
      // TODO: check amount is between minQuota and maxQuota
      let validTo = this.bridge.validateToAccount(assetPair, "mint", this.state.receiver || account);
      console.log("validTo %s: %s", this.state.receiver || account, validTo);
      let task = await this.bridge.createTask(assetPair, 'mint', this.state.amount, account, this.state.receiver);
      this.setState({task, message: "start deposit task " + task.id});
    } catch(err) {
      this.setState({task: null, message: err});
    }
  }

  async withdraw() {
    let assetPair = this.state.assetPairs[this.state.pairIndex];
    console.log({assetPair});
    try {
      let account = this.bridge.getWalletAccount(assetPair, "burn");
      console.log({account});
      let balance = await this.bridge.getAccountAsset(assetPair, "burn", account);
      console.log({balance});
      // TODO: check balance
      let fee = await this.bridge.estimateFee(assetPair, "burn");
      console.log({fee});
      // TODO: accept fee or cancel the task
      let quota = await this.bridge.getQuota(assetPair, "mint");
      console.log({quota});
      // TODO: check amount is between minQuota and maxQuota
      let validTo = this.bridge.validateToAccount(assetPair, "burn", this.state.receiver || account);
      console.log("validTo %s: %s", this.state.receiver || account, validTo);
      let task = await this.bridge.createTask(assetPair, 'burn', this.state.amount, account, this.state.receiver);
      this.setState({task, message: "start withdraw task " + task.id});
    } catch(err) {
      this.setState({task: null, message: err});
    }
  }

  async cancel() {
    let task = this.state.task;
    if (task) {
      this.bridge.cancelTask(task.id);
      console.log("cancel task %s", task.id);
    } else {
      console.log("no task");
    }
  }

  onChangePair = event => {
    let pairIndex = event.target.value;
    this.setState({
      pairIndex,
      asset: this.state.assetPairs[pairIndex].assetType
    });
  }

  onChangeAmount = event => {
    let amount = event.target.value;
    this.setState({amount});
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
            <button onClick={() => this.connectMetaMask()}>Connect MetaMask</button>
            &nbsp;
            <button onClick={() => this.connectPolkadot()}>Connect Polkadot</button>
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
            &nbsp;&nbsp;
            <button onClick={() => this.cancel()}>Cancel task</button>
          </p>
          <p style={{color: "white"}}>{this.state.message}</p>
        </header>
      </div>
    );
  }
}

export default App;
