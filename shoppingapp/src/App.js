import logo from './logo.svg';
import './App.css';
import React from 'react';
import $, { data } from 'jquery';
import cartLogo from './cart.ico'
import tickLogo from './tick.ico'
import searchLogo from './find.ico'

/**
 * React component for the main page, displays all products
 * @param {*} props 
 * @returns a div containing rows of product
 */
function ProductPage(props){
  var rowsList=[]
  for (let i=0; i<props.productsList.length; i++){
    if (i%4===0){
      rowsList.push(props.productsList.slice(i, i+4))
    }
  }
  return (
    <div id="productsTable">
      {rowsList.map((e, i)=>{
          return <ProductRow key={i} products={e} viewDetail={props.viewDetail}/>
        })}
    </div>
  )
}

/**
 * React component for a row of products, we assume 4 in a row
 * @param {*} props 
 * @returns 
 */
function ProductRow(props){
  return (
    <div id='productsRow'>{
      props.products.map((e, i)=>{
        return <ProductIcon key={i} product={e} viewDetail={props.viewDetail}/>
      })
    } </div>
  )
}

/**
 * Component for a single item displayed on the main page
 * @param {*} props 
 * @returns 
 */
function ProductIcon(props){
  return (
    <div id='productIcon' onClick={()=>props.viewDetail(props.product._id)}>
      <img src={"http://localhost:3001/"+props.product.productImage} alt={"This is not found"} width={100} height={80}></img>
      <p>Name: {props.product.name}</p>
      <p>Price: {props.product.price}</p>
    </div>
  )
}

/**
 * Detail page of product
 */
class ProductDetail extends React.Component{
  constructor(props){
    super(props);
    this.state={
      product:{}
    }
    this.retrieveDetail = this.retrieveDetail.bind(this)
    this.handleAddToCart = this.handleAddToCart.bind(this)
  }

  /**
   * Retrieves detail of the product from the server
   */
  retrieveDetail(){
    $.get("http://localhost:3001/loadproduct/"+this.props.productID, function(res){
      this.setState({
        product: res
      })
    }.bind(this))
  }

  /**
   * Handle when add to cart button is clicked, first checks if logged in, if not, log in with the added items as parameters.
   */
  handleAddToCart(){
    var q=parseInt($("#quantityInput").val())
    // console.log("Q"+q)
    
    if (q>0){
      if (this.props.isSignedIn){
        $.ajax({
          type: "PUT",
          url: "http://localhost:3001/addtocart",
          xhrFields:{withCredentials:true},
          data:{
            productID:this.state.product._id,
            quantity: q
          },
          success: function(res){
            console.log("Add to cart succeeded")
            console.log(res)
            this.props.setTotalNum(parseInt(JSON.parse(res)))
            this.props.changeToAddedPage()
          }.bind(this)
        })
      }else{
        this.props.handleLogin(this.state.productID, q, true);
      }
     } else {alert("Please input valid quantity")}
    
    
  }

  /**
   * Retrieve detail on mount
   */
  componentDidMount(){
    this.retrieveDetail()
  }

  render(){
    console.log("Pi is")
    console.log(this.state.product.productImage)
    return (
      <div id="itemDetailPage">
        <img src={"http://localhost:3001/"+this.state.product.productImage} alt="Image doesn't exist" width={50}></img>
        <div id="itemInfoDiv">
          <p>Item name: {this.state.product.name}</p>
          <p>Price: {this.state.product.price}</p>
          <p>Manufacturer: {this.state.product.manufacturer}</p>
          <p>Description: {this.state.product.description}</p></div>
        <div id="addToCartDiv">
          <label htmlFor="quantity">Quantity: </label>
          <input type="number" id="quantityInput" name="quantity" min="0"></input>
          <button id="addToCartButton" onClick={this.handleAddToCart}>Add to Cart</button>
        </div>
        <div>
          <button id="goBackButton" onClick={this.props.goBack}>{"<<"} Go Back</button>
        </div>
      </div>
    )
  }
}

/**
 * Compoment for a single entry in cart
 */
class CartIcon extends React.Component{
  constructor(props){
    super(props)
    this.state={
      _id: props._id

    }
    this.handleQuantityChange=this.handleQuantityChange.bind(this)
    this.handleBlur=this.handleBlur.bind(this)
  }

  /**
   * Checks if quantity is legal, if not legal, set the input back to original value onblur
   * If legal, when its zero delete the item by calling /deletefromcart
   *            when its not zero update database by calling /updatecart
   * If not legal, do nothing
   * @param {*} e Event when input number field changes
   */
  handleQuantityChange(e){
    var quantity=parseInt(e.target.value)
    // var prevQ=this.props.product.quantity
    // console.log(quantity)
    if (quantity>=0){
      if (quantity==0){
        console.log(this.props.productID)
        $.ajax({
          type: "DELETE",
          url: "http://localhost:3001/deletefromcart/"+this.props.productID,
          xhrFields:{withCredentials:true},
          success: function(res){
            this.props.setTotalNum(parseInt(JSON.parse(res)))
            this.props.changeQuantity(this.props.index, quantity)
          }.bind(this)
        })
      }
      else{
        console.log(this.props.productID)
        $.ajax({
          type:"PUT",
          url:"http://localhost:3001/updatecart",
          data: {
            productID: this.props.productID,
            quantity: quantity,
            // diff: quantity-prevQ
          },
          // dataType:"JSON",
          xhrFields:{withCredentials:true},
          success:function(res){
            // console.log("Update success")
            // console.log(res)
            this.props.setTotalNum(parseInt(JSON.parse(res)))
            // console.log(this.props.index)
            this.props.changeQuantity(this.props.index, quantity)
          }.bind(this)
        })
      }
    }
    
  }

  /**
   * If not legal input value, reset the input to original value
   * @param {*} e Blue event
   */
  handleBlur(e){
    if (isNaN(parseInt(e.target.value))){
      e.target.value=this.props.product.quantity
    }
  }
  render(){
    return (
      <tr>
        <td><img src={"http://localhost:3001/"+this.props.product.productImage} alt="not found" height={80} width="100"></img></td>
        <td><h3>{this.props.product.name}</h3></td>
        <td>{this.props.product.price}</td>
        <td><input type="number" defaultValue={this.props.product.quantity} min="0" onChange={this.handleQuantityChange} onBlur={this.handleBlur}></input></td>
      </tr>
    )
  }
}

/**
 * Component for the whole cart page
 */
class CartPage extends React.Component{
  constructor(props){
    super(props);
    this.state={
      cart: []
    }
    this.getCart = this.getCart.bind(this)
    this.changeQuantity=this.changeQuantity.bind(this)
  }

  /**
   * Get cart, and set to the state to cart
   */
  getCart(){
    console.log("Getcart run")
    $.ajax({
      type: "GET",
      url: " http://localhost:3001/loadcart",
      xhrFields: {withCredentials: true},
      success: function(res){
        console.log(res)
        var cart=[]
        var sorted_cart=res.cart;
        var sorted_product=res.product;
        sorted_cart.sort((a, b)=>{return (a.productID>b.productID)? 1: -1})
        sorted_product.sort((a, b)=>{return (a._id>b._id)? 1: -1})
        for (let i=0; i<res.cart.length; i++){
          cart.push({
            _id:sorted_cart[i].productID,
            p_id:sorted_product[i]._id,
            quantity:sorted_cart[i].quantity,
            name: sorted_product[i].name,
            price: sorted_product[i].price,
            productImage: sorted_product[i].productImage,
          })
        }
        console.log(cart)
        this.setState({cart: cart})
      }.bind(this)
    })
  }
  
  /**
   * Change the states on the client, so all the quantities displayed are correct
   * @param {*} index Index of the item whose quantity changed
   * @param {*} quantity The quantity to change to
   */
  changeQuantity(index, quantity){
    var newCart=JSON.parse(JSON.stringify(this.state.cart))
    newCart[index].quantity=quantity
    console.log(quantity)
    console.log(newCart[index].quantity)
    if (quantity==0){
      newCart.splice(index, 1);
      // console.log(newCart)
    }
    this.setState({
      cart: newCart
    })
    // this.props.setTotalNum(newCart.reduce((sum, e)=>sum+e.quantity, 0))
  }

  /**
   * Get cart on mount
   */
  componentDidMount(){
    this.getCart()
  }
  
  render(){
    console.log("Cart rendered")
    console.log(this.state.cart)
    var subtotal=this.state.cart.reduce((sum, e)=>sum+e.quantity*e.price, 0)
    return(
      <>
      <h2>Shopping cart</h2>
      <table id="cartTable">
        <thead>
          <tr><th></th><th></th>
          <th>Price: </th><th>Quantity: </th></tr>
        </thead>
        <tbody>
          {
            this.state.cart.map((e, i)=><CartIcon index={i} product={e} key={e._id} productID={e._id} changeQuantity={this.changeQuantity} setTotalNum={this.props.setTotalNum}></CartIcon>)
          }
        </tbody>
      </table>
      <p id="subtotalParagraph">Cart subtotal ({this.props.totalnum} {this.props.totalnum>1? "items": "item"}): ${subtotal}</p>
      <div id="backCheckOutButtons"><button id="backButton" onClick={this.props.goBack}>Back</button><button id="checkOutButton" onClick={()=>this.props.handleCheckout(subtotal)}>Proceed to check out</button></div>
      </>
    )
  }
}

/**
 * The header bar
 */
class SearchBar extends React.Component{
  constructor(props){
    super(props);
    this.state={
      category:"",
      searchString:""
    }
    this.handleSearchStringChange = this.handleSearchStringChange.bind(this)
    this.handleCategoryChange = this.handleCategoryChange.bind(this)
    this.handleSearch=this.handleSearch.bind(this)
    this.handleCategoryClick=this.handleCategoryClick.bind(this)
  }

  /**
   * When user change search string, update state immediately
   * @param {*} event Search string changed
   */
  handleSearchStringChange(event){
    const target=event.target;
    const value=target.value;
    this.setState({searchString:value})
    
  }
  /**
   * When user change category, update state immediately
   * @param {*} event Category changed
   */
  handleCategoryChange(event){
    const target = event.target;
    const value=target.value;
    this.setState({category: value});
    this.props.goBack();
  }

  /**When user clicks a category on the leftmost, update state
   */
  handleCategoryClick(event){
    const target = event.target;
    const value=target.innerHTML;
    this.setState({category: value});
    $("#categorySelection").val(value);
    this.props.goBack();
  }

  /**
   * Handle when search button is clicked
   */
  handleSearch(){
    this.props.showProducts(this.state.category, this.state.searchString)
    this.props.goBack();
  }       

  /**
   * When search string or category changed
   * @param {*} prevProps 
   * @param {*} prevState 
   */
  componentDidUpdate(prevProps, prevState){
    if (this.state.category!==prevState.category){
      this.props.showProducts(this.state.category, this.state.searchString)
    }
  }
  render(){
    return (
      <div id="searchBar">
        <div id="catDiv">
           {this.props.categoriesList.map((e)=>{
              return <div onClick={this.handleCategoryClick}><b>{e}</b></div>
            })}
        </div>
        <div id="searchDiv">

          <div id="categorySelectionDiv">
            <select name="categorySelection" id="categorySelection" onChange={this.handleCategoryChange} defaultValue="">
              <option value="" disabled hidden>Choose a category</option>
              <option value="">All</option>
                {this.props.categoriesList.map((e)=>{
                  return <option value={e} key={e}>{e}</option>
                })}
            </select>
          </div>
          <div id="searchStringInputDiv">
            <input type="text" id="searchStringInput" onChange={this.handleSearchStringChange}></input>
          </div>

          <div id="searchButtonDiv"><button id="searchButton" onClick={this.handleSearch}><img src={searchLogo}></img></button></div>
          
        </div>
        {
          (this.props.isSignedIn)? <>
            <div id="cartInfoDiv">
              <button onClick={this.props.handleViewCart} id="viewCartButton">
                <img src={cartLogo} alt="cart" width="20"></img> View Cart
              </button>
              <p id="totalnumP">{this.props.totalnum} in cart.</p>
            </div>
            <div id="greetingDiv"><p id="addressP"> Hello! {this.props.username}</p> 
          <button id="signOutButton" onClick={this.props.handleSignOut}>Sign Out</button></div></>
          : <button id="loginButton" onClick={this.props.handleLogin}>Log In</button>
        }
      </div>
    )
  }
}

/**
 * Page displayed after an item is added to cart
 */
class AddedToCartPage extends ProductDetail{
  constructor(props){
    super(props)
  }

  render(){
    return (
      <div id="addToCartPage">
        <img src={"http://localhost:3001/"+this.state.product.productImage} alt="Image doesn't exist" width={500}></img>
        <div id="addedNoti"><p><img src={tickLogo} alt="broken"></img> Added to cart</p></div>
        <button id="continueButton" onClick={this.props.goBack}>Continue Browsing</button>
      </div>
    )
  }
}

/**
 * The main app
 */
class App extends React.Component {
  constructor(props){
    super(props);
    this.state={
      isSignedIn: true,
      viewType:"productsList",
      productID: 0,
      quantity: 0,
      productsList: [],
      categoriesList: [],
      username: "",
      cart:[],
      totalnum:0,
      showAdded:false,
      subtotal:0,
      checkOutNum:0
    }
    this.showAllProducts=this.showAllProducts.bind(this)
    this.showProducts=this.showProducts.bind(this)
    this.viewDetail=this.viewDetail.bind(this)
    this.goBack=this.goBack.bind(this)
    this.handleLogin=this.handleLogin.bind(this)
    this.handleSignOut=this.handleSignOut.bind(this)
    this.login=this.login.bind(this)
    this.setSessionInfo=this.setSessionInfo.bind(this)
    this.handleViewCart=this.handleViewCart.bind(this)
    this.changeToAddedPage=this.changeToAddedPage.bind(this)
    this.setTotalNum=this.setTotalNum.bind(this)
    this.handleCheckout=this.handleCheckout.bind(this)
  }

  showAllProducts(){
    $.ajax(
      {
        type: "GET",
        url: "http://localhost:3001/loadpage?category=&searchstring=",
        success: function(response){
          let dupCat=response.map(e=>e.category)
          const categories=dupCat.filter(function(e, i){return dupCat.indexOf(e)===i})
          this.setState({
            productsList:response,
            categoriesList:categories
          })
        }.bind(this),
        
      }
    )
  }

  /**
   * Show all product satisfying category and search string
   * @param {*} category 
   * @param {*} searchString 
   */
  showProducts(category, searchString){
    $.get("http://localhost:3001/loadpage?category="+category+"&searchstring="+searchString, function(response){
        this.setState({
          productsList:response
      })}.bind(this))}

  /**
   * Go back to main page
   */
  goBack(){
    this.setState({
      viewType:"productsList"
    })
  }

  /**
   * Set the session info isSignedin, username, totalnum
   */
  setSessionInfo(){
    console.log("Setting Session Info Set")
    $.ajax({
      type:"GET",
      url: "http://localhost:3001/getsessioninfo",
      xhrFields: {withCredentials: true},
      success: function(res){
        console.log("Set session info "+res)
        if (res!=="N/A"){
          this.setState({isSignedIn:true, username:res.username, totalnum:res.totalnum, cart: res.cart})
        } else{
          this.setState({isSignedIn:false})}
      }.bind(this)
    })
  }

  /**
   * Set the totalnum to argument num
   * @param {*} num number to set
   */
  setTotalNum(num){
    this.setState({
      totalnum: num
    })
  }


  componentDidMount(){
    this.showAllProducts();
    this.setSessionInfo();
  }

  /**
   * Change to the detail view of product
   * @param {*} id product ID
   */
  viewDetail(id){
    this.setState(
      {viewType: "detailView",
      productID: id}
    )
  }

  /**
   * Change to page after item is added
   */
  changeToAddedPage(){
    this.setState({
      viewType:"addedToCartView",
    })
  }

  /**
   * When login or add to cart is clicked
   * @param {*} productID product id user want to add
   * @param {*} quantity quantity
   * @param {*} showAdded indicating if or not show the page for added item after logging in
   */
  handleLogin(productID, quantity, showAdded){
    // var vtbl=this.state.viewType
    this.setState({
      viewType: "loginPage",
      // viewTypeBeforLogin:vtbl
      showAdded:showAdded,
      quantity:quantity
    })
  }

  /**
   * When signout button is clicked
   */
  handleSignOut(){
    $.ajax({
      type:"GET",
      url: "http://localhost:3001/signout",
      xhrFields:{withCredentials:true},
      success:function(res){
        alert(res)
        this.setSessionInfo()
        this.setState({
          viewType: "productsList"
        })
      }.bind(this)
    })
  }

  /**
   * When view cart button is clicked
   */
  handleViewCart(){
    console.log("view cart button clicked")
    this.setState({
      viewType: "cartView"
    })
  }

  /**
   * When checkout button is clicked
   * @param {*} subtotal Anount of money when check out
   */
  handleCheckout(subtotal){
    console.log("Checked out")
    console.log(subtotal)
    if(subtotal!==0){
      $.ajax({
        type: "GET",
        url:"http://localhost:3001/checkout",
        xhrFields:{withCredentials:true},
        success:function(res){
          if (res===""){
            var num=this.state.totalnum
            this.setState({
              viewType:"checkoutView",
              subtotal:subtotal,
              checkOutNum:num,
              totalnum: 0,
            })
          }
        }.bind(this)
      })
    }
    else{
      alert("Nothing to check out!!")
    }
  }

  /**
   * Routine for handling login, if log in from adding to cart, then perform add to cart action after
   */
  login(){
    var username=$("#username").val();
    var password=$("#password").val()
    if (username==''||password==''){
      alert("You must enter username and password")
    }
    else{
      $.ajax({
        type: "POST",
        url: "http://localhost:3001/signin",
        data: {username: username, password: password},
        xhrFields:{withCredentials:true},
        success: function(res){
          this.setSessionInfo();
          if (res=="Login failure"){
            alert(res)
          }
          else if (this.state.showAdded){
            $.ajax({
              type: "PUT",
              url: "http://localhost:3001/addtocart",
              xhrFields:{withCredentials:true},
              data:{
                productID:this.state.productID,
                quantity: this.state.quantity
              },
              success: function(res){
                console.log("Add to cart succeeded")
                this.changeToAddedPage()
                this.setTotalNum(parseInt(JSON.parse(res)))
                this.setState({
                  showAdded:false
                })
              }.bind(this)
            })
          } else {
            this.goBack()
          }
        }.bind(this),
        error: function(err){  
          console.log(err)
        }.bind(this)
      })
    }
    
    
  }

  render(){
    const searchBar=(
      <SearchBar 
          isSignedIn={this.state.isSignedIn} 
          categoriesList={this.state.categoriesList}
          showProducts={this.showProducts}
          handleLogin={this.handleLogin}
          handleSignOut={this.handleSignOut}
          username={this.state.username}
          totalnum={this.state.totalnum}
          handleViewCart={this.handleViewCart}
          goBack={this.goBack}
      />
    )
    if (this.state.viewType==="productsList"){
      return (
        <React.Fragment>
          {searchBar}
          <ProductPage productsList={this.state.productsList} viewDetail={this.viewDetail}/>
        </React.Fragment>
      )
    }

    if (this.state.viewType==="detailView"){
      // console.log(this.state.productID)
      return (
        <React.Fragment>
          {searchBar}
          <ProductDetail isSignedIn={this.state.isSignedIn} productID={this.state.productID} totalnum={this.state.totalnum} goBack={this.goBack} changeToAddedPage={this.changeToAddedPage} setTotalNum={this.setTotalNum} handleLogin={this.handleLogin}/>
        </React.Fragment>
      )
    }
    if (this.state.viewType==="loginPage"){
      return (
        <div id="loginPage">

          <div id="usernameDiv">
            <label htmlFor="username">Username:</label>
            <input type="text" name="username" id="username"></input>
          </div>

          <div id="passwordDiv">
            <label htmlFor="password">Password:</label>
            <input type="password" name="password" id="password"></input>
          </div>
          
          <div id="loginButtonDiv"><button id="loginButton" onClick={this.login}>Sign In</button></div>
          
        </div>
      )
    }

    if (this.state.viewType==="cartView"){
      return (
        <React.Fragment>
          {searchBar}
          <CartPage totalnum={this.state.totalnum} cart={this.state.cart} goBack={this.goBack} setTotalNum={this.setTotalNum} handleCheckout={this.handleCheckout}></CartPage>
        </React.Fragment>
        
      )
    }

    if (this.state.viewType==="addedToCartView"){
      return(
        <React.Fragment>
          {searchBar}
          <AddedToCartPage productID={this.state.productID} goBack={this.goBack}></AddedToCartPage>
        </React.Fragment>
      )
    }

    if (this.state.viewType==="checkoutView"){
      return(<React.Fragment>
        {searchBar}
        <div id="checkedOutPage">
          <img src={tickLogo} alt="no logo"></img>
          <p>You have successfully placed order for {this.state.checkOutNum} {this.state.totalnum>1? "items": "item"}</p> <br></br>
          <p>${this.state.subtotal} paid.</p>
          <button onClick={this.goBack}>Continue Browsing</button>
        </div>
        
      </React.Fragment>)
    }
      
  }
}


export default App;
