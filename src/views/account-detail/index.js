import React, { Component } from 'react';
import Wrapper from '../../components/wrapper';
import AccountLContent from './account-detail';
import Input from '../../components/public/input/input';
import Button from '../../components/public/button/button';
import ToggleBtn from '../../components/public/toggle/toggle-btn';
import ContainerToggle from '../../components/public/toggle/container-toggle';
import token from '../../utils/images/token.png';
import unstaking from '../../utils/images/unstaking.png';
import unstaked from '../../utils/images/unstaked.png';
import staked from '../../utils/images/staked.png';
import node from '../../utils/images/node.png';
import app from '../../utils/images/app.png';
import na from '../../utils/images/NA.png';
import sent from '../../utils/images/sent.png';
import received from '../../utils/images/received.png';
import load from '../../utils/images/load.png'; 
import reload from '../../utils/images/reload.png';
import reloadActive from '../../utils/images/refresh-active.png'
import T from '../../components/public/table/table';
import Th from '../../components/public/table/th';
import Td from '../../components/public/table/td';
import Tr from '../../components/public/table/tr';
import THead from '../../components/public/table/thead';
import TBody from '../../components/public/table/tbody';
import copy from '../../utils/images/copy.png';
import Config from "../../config/config.json";
import {
    withRouter
} from 'react-router-dom';
import Modal from "simple-react-modal";
import altertR from "../../utils/images/alert-circle-red.png";
import exit from '../../utils/images/exit.png';
import altertT from '../../utils/images/alert-triangle.png';
import PocketService from "../../core/services/pocket-service";
import {DataSource} from "../../datasource/datasource";

const dataSource = new DataSource();

class AccountLatest extends Component {
    constructor() {
        super();
        
        this.state = {
            normal: undefined,
            app: undefined,
            node: undefined,
            visibility: true,
            addressHex: "",
            publicKeyHex: "",
            ppk: "",
            poktBalance: 0,
            usdBalance: 0,
            noTransactions: true,
            stakedTokens: 0,
            stakingStatus: "UNSTAKED",
            stakingStatusImg: unstaked,
            displayApp: false,
            displayNode: false,
            privateKey: undefined,
            displayError: false,
            errorMessage: "",
            displayTxListSection: false,
            unstakingImgSrc: unstaking,
            stakedImgSrc: staked,
            unstakedImgSrc: unstaked,
            reloadImgSrc: reload,
            reloadActiveImgSrc: reloadActive,
            isModalVisible: false,
            displayPkReveal: <i class="fas fa-less    "></i>
        };

        // Binds
        this.onToggleBtn = this.onToggleBtn.bind(this);
        this.getBalance = this.getBalance.bind(this);
        this.getAccountType = this.getAccountType.bind(this);
        this.addAppOrNode = this.addAppOrNode.bind(this);
        this.getTransactions = this.getTransactions.bind(this);
        this.pushToSend = this.pushToSend.bind(this);
        this.pushToTxDetail = this.pushToTxDetail.bind(this);
        this.refreshView = this.refreshView.bind(this);
        this.enableLoaderIndicatory = this.enableLoaderIndicatory.bind(this);
        this.reloadBtnState = this.reloadBtnState.bind(this);
        this.revealPrivateKey = this.revealPrivateKey.bind(this);
        this.showModal = this.showModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.togglePkReveal = this.togglePkReveal.bind(this);
    }

    showModal() {
        this.setState({
            isModalVisible: true,
        });
    }

    closeModal() {
        this.setState({
            isModalVisible: false,
        });

        this.togglePkReveal(false);
    }
    
    togglePkReveal(show) {

        this.setState({
            displayPkReveal: show
        })
    }
    
    async revealPrivateKey() {
        const {ppk} = this.state;

        // passphrase-invalid
        const passphraseInput = document.getElementById("reveal-pk-passphrase");

        // Check for ppk and the element
        if (ppk && passphraseInput) {
            
            const account = await dataSource.importPortablePrivateKey(
                passphraseInput.value,
                ppk,
                passphraseInput.value
            );

            if (account === undefined) {
                this.setState({
                    displayError: true,
                    errorMessage: "Invalid passphrase."
                });

                return;
            }

            const unlockedAccount = await dataSource.getUnlockedAccount(account.addressHex, passphraseInput.value);

            if (unlockedAccount === undefined) {
                this.setState({
                    displayError: true,
                    errorMessage: "Invalid passphrase."
                });
                return;
            }

            // Show the private key information
            this.setState({
                privateKey: unlockedAccount.privateKey.toString("hex")
            });

            // Clear the passphrase input
            passphraseInput.value = "";

            // Toggle the passphrase view off
            this.togglePkReveal(true);
        }

    }

    // Retrieve the latest transactions
    async getTransactions(addressHex) {

        const allTxs = await dataSource.getAllTransactions(addressHex);

        if (allTxs !== undefined) {
            this.setState({
                visibility: true,
                noTransactions: false
            });
            this.updateTransactionList(allTxs);
        }else {
            this.setState({
                visibility: false, 
                noTransactions: true
            });
            
            this.enableLoaderIndicatory(false);
        }
    }

    updateTransactionList(txs) {
        try {
            // Transaction list section
            const section = document.getElementById('transation-list-section');
            // Invert the list
            const rTxs = txs.reverse();
            // Images src paths
            const sentImgSrc = sent;
            const receivedImgSrc = received;

            let idCounter = 1;

            rTxs.forEach(tx => {
                const events = JSON.parse(tx.tx_result.log)[0].events;

                if (events[1].type === "transfer") {
                    const attributes = events[1].attributes;
                    if (attributes[1].key === "amount") {
                        const value = attributes[1].value.replace("upokt","");
    
                        const txHash = tx.hash;
                        const imageSrc = tx.type.toLowerCase() === "sent" ? sentImgSrc : receivedImgSrc;
                        const TrClass = document.getElementById("tr-element").className;
                        const TdClass = document.getElementById("td-element").className;
                        
                        const txTemplate = '<Tr class="'+TrClass+'">\n' +
                            '<Td class="'+TdClass+'"> <img src='+ imageSrc +' alt="'+ tx.type.toLowerCase() +'" /> </Td>\n' +
                            '<Td class="'+TdClass+'"> <div class="qty">'+ value / 1000000 +' <span>POKT</span></div> <div class="status">'+ tx.type.toLowerCase() +'</div> </Td>\n' +
                            '<Td class="'+TdClass+' block-align">'+tx.height+'</Td>\n' +
                            '<Td class="'+TdClass+'"> <a id="txHashElement'+idCounter+'"> '+txHash+' </a> </Td>\n' +
                        '</Tr>';

                        section.insertAdjacentHTML('beforeend', txTemplate);
                        // Add onClick event to the clickable element
                        const toTxDetail = document.getElementById(`txHashElement${idCounter}`);

                        if (toTxDetail) {
                            toTxDetail.addEventListener("click", () => { this.pushToTxDetail(txHash) });
                        }
                        idCounter++;
                    }else {
                        console.dir(attributes, {depth: null});
                    }
                }
            })
            // Display the table
            this.setState({displayTxListSection: true});

            this.enableLoaderIndicatory(false);
        } catch (error) {
            console.log(error);
            this.enableLoaderIndicatory(false);
        }
    }
    async addAppOrNode(type = "app") {
        const {node, app, stakedImgSrc, unstakingImgSrc, unstakedImgSrc} = this.state;
        let account = app;

        if (type === "node") {
            account = node
        }

        if (account !== undefined) {
            // Update the staked amount
            
            const stakedTokens = Number(account.stakedTokens.toString()) / 1000000;

            let stakingStatus = "UNSTAKED";
            let stakingStatusImg = unstakedImgSrc;

            if (account.status === 1) {
                stakingStatus = "UNSTAKING";
                stakingStatusImg = unstakingImgSrc;
            }else if(account.status === 2){
                stakingStatus = "STAKED";
                stakingStatusImg = stakedImgSrc;
            }

            // Update the state
            this.setState({
                stakedTokens,
                displayApp: type === "app" ? true : false,
                displayNode: type === "node" ? true : false,
                stakingStatus,
                stakingStatusImg,
            });
        }
    }

    // Account type, amount staked and staking status
    async getAccountType(addressHex) {

        // Try to get the app information
        const appOrError = await dataSource.getApp(addressHex);

        if (appOrError !== undefined) {
            this.setState({app: appOrError.application});
            this.addAppOrNode();
        }
        // Try to get the node information
        const nodeOrError = await dataSource.getNode(addressHex);

        if (nodeOrError !== undefined) {
            this.setState({node: nodeOrError.node});
            this.addAppOrNode("node");
        }

        // If not and app or node, load normal account
        if (appOrError === undefined && nodeOrError === undefined) {
            // Account type, amount staked and staking status
            this.setState({displayNormalAccount: true});
        }
    }
    
    // Retrieves the account balance
    async getBalance(addressHex) {
        
        if (addressHex) {
            const balance = await dataSource.getBalance(addressHex);
            
            // Update account detail values
            const poktBalance = balance.toFixed(2);
            const usdBalance = (balance * Number(Config.POKT_USD_VALUE)).toFixed(2);
    
            // Save balance to the state
            this.setState({
                poktBalance,
                usdBalance
            })
        }
    }

    pushToTxDetail(txHash) {
        // Check the account info before pushing
        if (this.currentAccount.addressHex === undefined ||
            this.currentAccount.publicKeyHex === undefined ||
            this.currentAccount.ppk === undefined) {
            this.toggleError(true, "No account available, please create an account")
            return
        }
        if (txHash) {
            const accountObj = {
                addressHex: this.currentAccount.addressHex,
                publicKeyHex: this.currentAccount.publicKeyHex,
                ppk: this.currentAccount.ppk,
            }
            const obj = {
                tx: undefined,
                txHash: txHash,
                account: accountObj
            }
            // Move to the account detail
            this.props.history.push({
                pathname: "/transaction-detail",
                data: obj,
            })
        }
    }
    pushToSend() {
        // Check the account info before pushing
        if (this.currentAccount.addressHex === undefined ||
            this.currentAccount.publicKeyHex === undefined ||
            this.currentAccount.ppk === undefined) {
            this.toggleError(true, "No account available, please create an account")
            return
        }
        const accountObj = {
            addressHex: this.currentAccount.addressHex,
            publicKeyHex: this.currentAccount.publicKeyHex,
            ppk: this.currentAccount.ppk,
        }
        // Move to the account detail
        this.props.history.push({
            pathname: "/send",
            data: accountObj,
        })
    }
    reloadBtnState(boolean){
        const reloadBtn = document.getElementById("reload-btn")
        if (reloadBtn) {
            reloadBtn.src = boolean ? this.state.reloadActiveImgSrc : this.state.reloadImgSrc
        }
    }

    // Transaction list toggle
    onToggleBtn() {
        this.setState((prevState) => {
            return { visibility: !prevState.visibility };
        })
    }

    enableLoaderIndicatory(show){
        const loaderElement = document.getElementById("loader")
        if (loaderElement) {
            loaderElement.style.display = show === true ? "block" : "none"
        }
    }

    refreshView(addressHex) {
        this.enableLoaderIndicatory(true);
        this.getBalance(addressHex);
        this.getAccountType(addressHex);
        this.getTransactions(addressHex);
    }

    componentDidMount() {

        const {addressHex, publicKeyHex, ppk} = PocketService.getUserInfo();

        if (addressHex && publicKeyHex && ppk) {
            // Save information to the state
            this.setState({
                addressHex, 
                publicKeyHex, 
                ppk
            });
            // Load the account balance, type and transaction list
            this.refreshView(addressHex);
        } else {
            // Redirect to the home page
            this.props.history.push({
                pathname: '/'
            });
        }

        // Navigation Item
        const navAccount = document.getElementById("navAccount");
        
        if (navAccount) {
            navAccount.style.display = "inline";
        }
    }
    
    // Render
    render() {
        // Check if current account information is set
        const {
            addressHex, 
            publicKeyHex, 
            privateKey,
            poktBalance, 
            usdBalance, 
            visibility, 
            noTransactions,
            stakedTokens,
            stakingStatus,
            stakingStatusImg,
            displayApp,
            displayNode,
            displayError,
            errorMessage,
            displayTxListSection,
            isModalVisible,
            displayNormalAccount,
            displayPkReveal
        } = this.state;

        if (addressHex === undefined || publicKeyHex === undefined) {
            // Redirect to the home page
            this.props.history.push({
                pathname: '/'
            })
            return null;
        }
        
        return (
            <AccountLContent>
                <Wrapper className="wide-block-wr">
                    <div className="quantitypokt">
                        <div className="container">
                            <h1 >{poktBalance} POKT</h1>
                            <div style={{flexDirection: "column"}} className="stats">
                                <div className="stat">
                                    <span>$ {usdBalance} USD</span>
                                    <img 
                                    id="reload-btn"
                                    src={reload}
                                    className="refresh-btn" 
                                    onMouseOut={() => this.reloadBtnState(false)}
                                    onMouseOver={() => this.reloadBtnState(true)}
                                    style={{
                                        src: `${this.state.hovered ? reloadActive : reload}`,
                                        cursor: "pointer"
                                    }}
                                    onClick={this.refreshView} 
                                    alt="reload" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="pokt-options">
                        {/* Normal Account Section */}
                        <div style={{ 
                            display: displayNormalAccount === true ? "flex" : "none"
                            }} id="normal-type-section" className="container">
                            <div className="option">
                                <div className="heading">
                                    <img style={{display: "inline-block"}} src={token} alt="staked tokens"/>
                                    <h2 style={{display: "inline-block", verticalAlign: "bottom"}}>  0 </h2>
                                </div>
                                <span className="title">Staked POKT</span>
                            </div>
                            <div className="option">
                                <div className="heading">
                                    <img style={{display: "inline-block"}} id="normal-stake-status-img" src={unstaked} alt="staked tokens"/>
                                    <h2 style={{display: "inline-block", verticalAlign: "bottom"}}>  UNSTAKED </h2>
                                </div>
                                <span className="title">Staking Status</span>
                            </div>
                            <div className="option">
                                <div className="heading">
                                    <img style={{display: "inline-block", marginBottom: "4px"}} src={na} alt="staked tokens"/>
                                    <h2 style={{display: "inline-block", verticalAlign: "bottom"}}> NA</h2>
                                </div>
                                <span className="title">Account Type</span>
                            </div>
                        </div>
                        {/* / Normal Account Section */}
                        {/* NODE Section */}
                        <div style={{ 
                            display: displayNode === true ? "flex" : "none"
                            }} id="node-type-section" className="container">
                            <div className="option">
                                <div className="heading">
                                    <img style={{display: "inline-block"}} src={token} alt="staked tokens"/>
                                    <h2 style={{display: "inline-block", verticalAlign: "bottom"}} id="node-staked-tokens-amount" > {stakedTokens} </h2>
                                </div>
                                <span className="title">Staked POKT</span>
                            </div>
                            <div className="option">
                                <div className="heading">
                                    <img style={{display: "inline-block"}} id="node-stake-status-img" src={stakingStatusImg} alt="staked tokens"/>
                                    <h2 style={{display: "inline-block", verticalAlign: "bottom"}} id="node-staking-status"> {stakingStatus} </h2>
                                </div>
                                <span className="title">Staking Status</span>
                            </div>
                            <div className="option">
                                <div className="heading">
                                    <img style={{display: "inline-block"}} src={node} alt="staked tokens"/>
                                    <h2 style={{display: "inline-block", verticalAlign: "bottom"}}>  NODE</h2>
                                </div>
                                <span className="title">Account Type</span>
                            </div>
                        </div>
                        {/* / NODE Section */}
                        {/* APP Section */}
                        <div style={{ 
                            display: displayApp === true ? "flex" : "none", 
                            marginTop: "16px" 
                            }} id="app-type-section" className="container">
                            <div className="option">
                                <div className="heading">
                                    <img style={{display: "inline-block"}} src={token} alt="staked tokens"/>
                                    <h2 style={{display: "inline-block", verticalAlign: "bottom"}} id="app-staked-tokens-amount">  {stakedTokens} </h2>
                                </div>
                                <span className="title">Staked POKT</span>
                            </div>
                            <div className="option">
                                <div className="heading">
                                    <img style={{display: "inline-block"}} id="app-stake-status-img" src={stakingStatusImg} alt="staked tokens"/>
                                    <h2 style={{display: "inline-block", verticalAlign: "bottom"}} id="app-staking-status"> {stakingStatus} </h2>
                                </div>
                                <span className="title">Staking Status</span>
                            </div>
                            <div className="option">
                                <div className="heading">
                                    <img style={{display: "inline-block"}} src={app} alt="staked tokens"/>
                                    <h2 style={{display: "inline-block", verticalAlign: "bottom"}}>  APP</h2>
                                </div>
                                <span className="title">Account Type</span>
                            </div>
                        </div>
                        {/* / APP Section */}
                        <div className="btn-subm">
                            <Button target="_target" href={Config.BUY_POKT_BASE_URL} dark>Buy POKT</Button>
                            <Button id="send-pokt" onClick={this.pushToSend}>Send</Button>
                        </div> 
                    </div>
                    <form className="pass-pk">
                        <div className="container">
                            <div className="cont-input">
                                <label htmlFor="add">Address</label>
                                <Input style={{height: "11px"}} type="text" name="address" id="address" defaultValue={addressHex} readOnly={true}/>
                                <span className="copy-button" onClick={() => {navigator.clipboard.writeText(addressHex)}}> <img src={copy} alt="copy" /></span>
                            </div>
                            <div className="cont-input second">
                                <label htmlFor="puk">Public Key</label>
                                <Input style={{height: "11px"}} type="text" name="public-k" id="public-key" defaultValue={publicKeyHex} readOnly={true}/>
                                <span className="copy-button" onClick={() => {navigator.clipboard.writeText(publicKeyHex)}}> <img src={copy} alt="copy" /></span>
                            </div>
                            <div className="cont-input third">
                                <Button id="reveal-pk" onClick={this.showModal}>Reveal Private Key</Button>
                            </div>
                        </div>
                    </form>
                    <div className="toggle-btn">
                        <ToggleBtn style={{
                            display: noTransactions === true ? "block" : "none"
                        }} >No Transactions</ToggleBtn>
                        <ToggleBtn style={{
                            display: noTransactions === true ? "none" : "block"
                        }} id="tooglebtn" onClick={this.onToggleBtn}>Latest Transactions</ToggleBtn>
                    </div>
                    <ContainerToggle isVisible={visibility}>
                        <T>
                            <THead className="latest-tx">
                                <Tr>
                                <Th> </Th>
                                <Th>STATUS</Th>
                                <Th>BLOCK HEIGHT</Th>
                                <Th> TX HASH</Th>
                                </Tr>
                            </THead>
                            <TBody style={{
                                display: displayTxListSection === true ? "block" : "none"
                                }} id="transation-list-section" className="l-tx table-scroll">
                                 <Tr id="tr-element" style={{display: "none"}}>
                                    <Td id="td-element"> <img src={load} alt="loading" /> </Td>
                                    <Td> <div className="qty">0.00 <span>POKT</span></div> <div className="status">Sending</div> </Td>
                                </Tr>
                            </TBody>
                        </T>
                    </ContainerToggle>
                </Wrapper>
                <Modal
                        style={{ background: "rgba(0, 0, 0, 0.5)" }} //overwrites the default background
                        containerStyle={{
                            width: "534px",
                            background: "white",
                            boxShadow: "0 43px 39px -40px rgba(0,0,0,0.5)",
                            borderRadius: "12px",
                            padding: "5px 0px 13px"
                        }} //changes styling on the inner content area
                        containerClassName="pocket-modal"
                        closeOnOuterClick={true}
                        show={isModalVisible}
                        onClose={this.closeModal.bind(this)}
                    >
                        <div className="cont-input" style={{textAlign: "center"}}>
                            <label style={{display: isModalVisible === true ? "block" : "none"}} id="passphrase-label" className="passphrase-label" htmlFor="private">
                                PASSPHRASE
                            </label>
                            <Input
                                className="reveal-pk-passphrase"
                                style={{ 
                                    display: isModalVisible === true ? "block" : "none",
                                    margin: "8px auto auto auto", 
                                    width: "350px" }}
                                type="password"
                                name="reveal-pk-passphrase"
                                id="reveal-pk-passphrase"
                                placeholder="Passphrase"
                                minLength="1"
                            />
                            <div id="private-key-container" style={{display: displayPkReveal === true ? "block" : "none"}}>
                                <label id="private-key-label" className="passphrase-label" htmlFor="private">
                                    PRIVATE KEY
                                </label>
                                <Input style={{ 
                                    backgroundColor: "#f5f5f5", 
                                    height: "20px",
                                    width: "350px",
                                    marginTop: "9px"
                                    }} type="text" name="private-k" id="private-key-input" defaultValue={privateKey ? privateKey : ""} readonly />
                                <span style={{marginTop: "18px"}} className="copy-button" onClick={() => {navigator.clipboard.writeText(privateKey)}}> <img src={copy} alt="copy" /></span>
                            </div>
                        </div>
                        <span id="passphrase-invalid" className="error" style={{ display: displayError === true ? "block" : "none" }}>
                            {errorMessage}
                            <img src={altertR} alt="alert" />
                            Invalid Passphrase
                        </span>
                        <Button
                            style={{
                                textAlign: "center",
                                width: "119px", 
                                display: displayPkReveal === true ? "none" : "block",
                                padding: "9px 6px",
                                margin: "24px auto 10px auto" }}
                            onClick={this.revealPrivateKey.bind(this)}
                        >
                            Reveal
                        </Button>
                        <button className="close" onClick={this.closeModal.bind(this)}>
                            <img src={exit} alt="exit icon close"/>
                        </button>
                        <div className="alert">
                                <img src={altertT} alt="alert" />
                                <div className="cont-alert">
                                    <div className="title">
                                        <h3>SAVE YOUR PRIVATE KEY!</h3>
                                    </div>
                                    <p>
                                        You wont be able to reveal it again or restore it. Make a back up and store it safely, preferably offline. You’ll need it to access your account.
                                    </p>
                                </div>
                            </div>
                    </Modal>
            </AccountLContent>
        );
    }
}

export default withRouter(AccountLatest);