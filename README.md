<a name="readme-top"></a>

<br />
<div align="center">
  <a href=".">
    <img src="public/img/logo.png" alt="Logo" width="150" height="150">
  </a>

  <h3 align="center">Area 117</h3>

  <p align="center">
    Real-time peer-to-peer chat application with WebRTC.
    <br />
    <br />
    <a href=".">View Demo</a>
    <a href=".">Report Bug</a>
    <a href=".">Request Feature</a>
  </p>
</div>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#running-the-application">Running the Application</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

## About The Project

![Product Name Screen Shot][product-screenshot]

This project is a real-time peer-to-peer chat application using WebRTC, designed with a strong focus on security and privacy. It enables direct communication between users without relying on central servers for message transmission, ensuring enhanced confidentiality.

Key features include:
* Establishes encrypted data channels between users for secure and private messaging.
* Prioritizes user privacy by avoiding the storage of message content on servers and leveraging WebRTC's decentralized communication model.
* Facilitates secure file sharing directly through the encrypted chat interface.

This project was developed to explore the capabilities of WebRTC in providing secure and private peer-to-peer communication solutions, emphasizing user confidentiality and data protection.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Built With

* HTML, CSS, JavaScript
* Bootstrap (for icons)
* Node.js
* Express.js (for routing and middleware)
* Socket.IO (for real-time communication)
* WebRTC (for establishing peer-to-peer connections)
* Various npm packages for handling file uploads, cryptography, and more

<p align="right">(<a href="#readme-top">back to top</a>)</p>


## Getting Started

To get a local copy of this project up and running on your machine, follow these steps:

### Prerequisites

Ensure you have the following installed on your development machine:

* Node.js (version 14.x or later)
* npm (comes with Node.js)
* Modern web browser with WebRTC support (e.g., Chrome, Firefox)

### Installation

1. Clone the repository: 
   ```sh
   git clone https://github.com/YassineFaidi/Area117.git
   ```
2. Navigate into the project directory:
   ```sh
   cd Area117
   ```
3. Install dependencies:
   ```sh
   npm install
   ```

### Running the Application

1. Start the server:
   ```sh
   npm start
   ```
   This command will start the server at http://localhost:1234/. You can access the application in your web browser.

2. Open the application:

* Open your web browser and go to http://localhost:1234/.

<p align="right">(<a href="#readme-top">back to top</a>)</p>


## Usage

* After navigating to the application URL, sign up with your username.

* You will be redirected to the main chat interface.

* Click on a user from the online peers list to initiate a chat.

* You can exchange text messages and files securely using the WebRTC-based data channel.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## License

This project is open source and available under the [MIT License](LICENSE).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contact

Yassine Faidi: [@my_linkedin](https://www.linkedin.com/in/yassine-faidi-853671247/) - yassinefaidi133@gmail.com

Project Link: [https://github.com/YassineFaidi/Area117.git](https://github.com/YassineFaidi/Area117.git)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

[product-screenshot]: public/img/appimg.png
