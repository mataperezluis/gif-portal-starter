import {Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import {Program, Provider, web3} from '@project-serum/anchor'; 
import {Buffer} from "buffer";

import React, {useEffect, useState} from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import idl from "./idl.json"
import kp from './keypair.json'

const {SystemProgram, Keypair} = web3;
window.Buffer = Buffer;

const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

const programID = new PublicKey(idl.metadata.address)
const network = clusterApiUrl('devnet')

const opts = {
  prefligthCommitment : "processed"
}


// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const TEST_GIFS = ["https://c.tenor.com/2CjQ6FVmwEQAAAAC/pai-mei.gif"]

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [gifList, setGifList] = useState([])
  const checkIfWalletisConnected = async() => {
      try {
        const {solana}=window;
        if(solana)
        {
          if(solana.isPhantom)
          {
            console.log('Phantom Wallet Found')
            const response = await solana.connect({onlyIfTrusted: true})
            console.log('Connected with Public Key:',response.publicKey.toString())
            setWalletAddress(response.publicKey.toString())
          }
        }else{
          alert('Solana Object not found')
        }
      } catch (error) {
        console.error(error)
      }
    
    
  }
  const connectWallet = async() => {
    const {solana} = window;
    if (solana){
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString())
      setWalletAddress(response.publicKey.toString())
      
    }
  };
  const sendGif = async() => {
    if(inputValue.length > 0)
    {
      console.log('Gif link:', inputValue)

      try{
        const provider = getProvider()
        const program = new Program(idl,programID,provider)
        await program.rpc.addGif(inputValue, {
          accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey
          }
        })
        console.log("GIF uccefully sent to program", inputValue)
        await getGifList();
        setInputValue('')
      }catch(err){
        console.error(err);
      }

    }else{
      console.log('Error')
    }
  }
  const onInputChange = event => {
    const {value} = event.target;
    setInputValue(value)
  }

  const getProvider = () => {
    const connection = new Connection(network, opts.prefligthCommitment)
    const provider = new Provider(connection, window.solana, opts.prefligthCommitment)
    return provider
  }

  const createGifAccount = async () => {

    try{
      const provider = getProvider()
      const program = new Program(idl,programID,provider)
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        },
        signers: [baseAccount]
      })
      console.log("Created a new BaseAccount w/ address:",baseAccount.publicKey.toString())
      await getGifList()
    }catch(error)
    {
      console.log("Error creating BaseAccount account: ", error)
    }
    
  }
  
  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
      
      >Connect to Wallet</button>
  ) 
  const renderConnectedContainer = () => {

    console.log(gifList)
    if(gifList === null){
      return <div className="connected-container">
        <button className="cta-button submit-gif-button" onClick={createGifAccount}>
          do One-Time Initialization for GIF Program Account
        </button>
      </div>
    }
    
    else{
      
      return (
            <div className='connected-container'>
              <form
                onSubmit = {event => {
                  event.preventDefault()
                  sendGif()
                }}>
                <input type="text" placeholder="Enter gif link!" value={inputValue} onChange={onInputChange}/>
                <button type="Submit" className="cta-button submit-gif-button">Submit</button>
                </form>
              <div className='gif-grid'>
                {gifList.map((item,index)=> (
                  <div className='gif-item' key={index}>
                    <img src={item.gifLink} alt={item.gifLink} />
                  </div>
                ))}
                </div>
              </div>
          )
        }
  
  }
  useEffect (() => {
    const onLoad = async() => {
      await checkIfWalletisConnected()
    }
    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [])

  const getGifList = async() => {
    try{
      const provider = getProvider()
      const program = new Program(idl, programID, provider)
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey)
      console.log('Got the account',account)
      setGifList(account.gifList)
    }catch(error)
    {
      console.error("Error en getGifList:",error)
      setGifList(null)
    }
  }
  
  useEffect(() => {
    if(walletAddress){
      console.log('Fetching....')
      getGifList()
    }
  }, [walletAddress])
  return (
    <div className="App">
      <div className={walletAddress ? "authed-container" : "container"}>
        <div className="header-container">
          <p className="header">🖼 GIF Portal</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`Adapted from @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
