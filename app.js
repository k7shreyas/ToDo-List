const express = require('express')
const bodyParser = require('body-parser')
const date = require(__dirname + "/date.js")
const mongoose = require("mongoose")
const _ =require('lodash')
const app = express()

app.set('view engine',"ejs")
app.use(bodyParser.urlencoded({exetnded: true}))
app.use(express.static('public'))

//database
mongoose.connect('mongodb+srv://ShreyK:me@crYpt0@cluster0.c0eqb.mongodb.net/todoDB', {useNewUrlParser: true})

const itemsSchema={
	name: String
}

const Item = mongoose.model("Item", itemsSchema)

const item1 = new Item({
	name: "Welcome to you todo list"
})
const item2 = new Item({
	name: "Hit the + button to add new item"
})
const item3 = new Item({
	name: "<-- Hit this to delete an item"
})

const defaultItems = [item1, item2, item3]

const listSchema = {
	name: String,
	items: [itemsSchema]
}

const List = mongoose.model("List", listSchema)
//get methods
app.get('/', function(req,res)
{
	let day = date()		//run whatever bound to "date" module
	Item.find({}, function(err, foundItems)
	{
		if(foundItems.length ===0)
		{
			Item.insertMany(defaultItems, function(err)
			{
				if(err)
					console.log(err)
				else
					console.log("Updated database")
			})
			res.redirect("/")
		}
		else
			res.render('list', {listTitle:"Today", newListItems:foundItems})
	})
})

app.get('/:customListName', function(req,res)
{
	const customListName= _.capitalize(req.params.customListName)

	List.findOne({name:customListName}, function(err, foundList)
	{
		if(!err){
			if(!foundList)
			{
				//create a new list
				const list=new List({
				name: customListName,
				items: defaultItems
				})
				list.save()
				res.redirect('/' + customListName)
			}
			else
				//show existiing one
				res.render('list', {listTitle: foundList.name, newListItems:foundList.items})
		}
	})
})


//post methods
app.post("/", function(req,res)
{
	let itemName = req.body.newItem
	let listName = req.body.list
	const item = new Item({
		name: itemName
	})
	if(listName ==="Today")
	{
		item.save();
		res.redirect('/');
	}
	else{
		List.findOne({name: listName}, function(err, foundList){
			foundList.items.push(item)
			foundList.save()
			res.redirect("/" + listName)
		})
	}
})

//form should be submitted thr btn to post request
app.post("/delete", function(req,res)
{
	const checkedItemId = req.body.checkbox;
	const listName = req.body.listName

	if(listName==="Today"){
		Item.findByIdAndRemove(checkedItemId, function(err)
		{
			if(err)
				console.log(err)
			else
				console.log("Deleted Item Succesfully!!")
		})
		res.redirect('/')
	}
	else
	{
		List.findOneAndUpdate({name: listName}, {$pull: {items:{_id: checkedItemId}}}, function(err, foundList)
		{
			if(!err)
				res.redirect("/" + listName)
		})
	}
})

//listen
app.listen(3000, function(req,res)
{
	console.log("Server started on port 3000")
})