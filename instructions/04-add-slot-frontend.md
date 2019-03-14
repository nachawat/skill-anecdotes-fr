# Add Slot to Interaction Model

### **Objective** : You will add a slot to your Voice User Interface (VUI) to be able to understand a city mentionned by a user.

1. Navigate to the `Build` Tab and select the `GetNewFactIntent`

![console](./images/locate_getnewfactintent.png)

2. On the intent `GetNewFactIntent` add the following utterances :

```
{citySlot}

donne-moi un fait sur {citySlot}

trouve-moi une anecdote sur {citySlot}

me donner un fait sur {citySlot}

je veux une anecdote sur {citySlot}
```

![console](./images/add_city_slot.png)

>  **Important**: A Slot must have a Slot Type assigned to be functional. In our case, we want the newly created slot to recognize cities. We will select as Slot Type for `citySlot` the predefined Type Slot `AMAZON.City` 

3. Define the Slot Type for Slot `citySlot` to be `AMAZON.City`

![console](./images/add_city_slot.png)

4. Save your Interaction Model

![save](./images/todo_save_model.png)

>  **Important**: The developer console does not automatically save your work as you make changes. If you close the browser window without clicking Save Model, your work is lost.


5. Build your Interaction Model

![save](./images/todo_build_model.png)

> **Important**: You must successfully build the model before you can test it.

### Next : [Handle the Slot in your backend](./05-add-slot-backend.md)