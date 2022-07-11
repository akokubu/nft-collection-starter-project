import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import myEpicNft from "./utils/MyEpicNFT.json";
import ReactLoading from "react-loading";

// Constantsを宣言する: constとは値書き換えを禁止した変数を宣言する方法です。
const TWITTER_HANDLE = "ebookak";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = "";
const TOTAL_MINT_COUNT = 50;
const CONTRACT_ADDRESS = "0x56ED2E9cB963a0527eE324C78F78aEd61839a275";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [mintCount, setMintCount] = useState(0);
  const [loading, setLoading] = useState(false);
  console.log("currentAccount: ", currentAccount);

  window.ethereum.on("chainChanged", (chainId) => {
    // Handle the new chain.
    // Correctly handling chain changes can be complicated.
    // We recommend reloading the page unless you have good reason not to.
    window.location.reload();
  });

  const checkRinkebyTestNet = async () => {
    let chainId = await getChainId();
    console.log("Connected to chain " + chainId);
    const rinkebyChainId = "0x4";

    if (chainId !== rinkebyChainId) {
      throw new Error("You are not connected to the Rinkeby Test Network!");
    }
  };

  const getChainId = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure you have Metamask!");
      return;
    } else {
      console.log("We have ethereum object", ethereum);
    }
    const chainId = await ethereum.request({ method: "eth_chainId" });

    console.log("chainId=", chainId);
    return chainId;
  };

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure you have Metamask!");
      return;
    } else {
      console.log("We have ethereum object", ethereum);
    }

    try {
      await checkRinkebyTestNet();
    } catch (error) {
      alert(error);
      return;
    }
    getCurrentMintCount();

    // ユーザが認証可能なウォレットアドレスを持っている場合は、
    // ユーザに対してウォレットへのアクセス許可を求める
    // 許可されれば、ユーザの最初のウォレットアドレスをaccountsに格納する
    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);

      setupEventListener();
    } else {
      console.log("No authorized account found");
    }
  };

  const connectWallet = async () => {
    try {
      await checkRinkebyTestNet();
    } catch (error) {
      alert(error);
      return;
    }
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);

      setupEventListener();
    } catch (error) {
      console.log(error);
    }
  };

  const moveToRarible = () => {
    window.open(
      `https://rinkeby.rarible.com/collection/${CONTRACT_ADDRESS}/items`,
      "_blank"
    );
  };

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );
        console.log("Going to pop wallet now to pay gas...");
        setLoading(true);
        let nftTxn = await connectedContract.makeAnEpicNFT();
        console.log("Mining...please wait.");
        await nftTxn.wait();

        console.log(
          `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
        );
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const setupEventListener = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        // NFTの発行
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          alert(
            `あなたのウォレットにNFTを送信しました。OpenSeaに表示されるまで最大10分かかることがあります。NFTへのリンクはこちらです: https://testnets.opensea.io/assets/rinkeby/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
          );
          setMintCount(tokenId.toNumber() + 1);
        });
        console.log("Setup event listener");
      } else {
        console.log("Ethereum object does'nt exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // renderNotConnectedContainer メソッドを定義します。
  const renderNotConnectedContainer = () => (
    <button
      onClick={connectWallet}
      className="cta-button connect-wallet-button"
    >
      Connect to Wallet
    </button>
  );

  const getCurrentMintCount = async () => {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const connectedContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        myEpicNft.abi,
        provider
      );
      console.log("connectedContract: ", connectedContract);
      const mintCount = await connectedContract.currentTokenId();
      setMintCount(mintCount.toNumber());
    }
  };

  useEffect(() => {
    const f = async () => {
      checkIfWalletIsConnected();
    };
    f();
  }, []);

  const MintButton = () => {
    return (
      mintCount < TOTAL_MINT_COUNT && (
        <button
          onClick={askContractToMintNft}
          className="cta-button connect-wallet-button"
        >
          Mint NFT
        </button>
      )
    );
  };

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">あなただけの特別な NFT を Mint しよう💫</p>
          {currentAccount === "" ? (
            renderNotConnectedContainer()
          ) : loading ? (
            <>
              <div className="spinner">
                <ReactLoading type="spin" />
              </div>
              <p className="sub-text">Loading....</p>
            </>
          ) : (
            <>
              <MintButton />
              <p className="sub-text">
                これまでに作成された {mintCount}/{TOTAL_MINT_COUNT} NFT
              </p>
              <button
                onClick={moveToRarible}
                className="cta-button connect-wallet-button"
              >
                Rarible でコレクションを表示
              </button>
            </>
          )}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
