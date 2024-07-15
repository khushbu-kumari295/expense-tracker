const uuid = require('uuid').v4;

let expenseState = {
    activites: {},
    userData: {},  // { 'user1': { balance: 30, friends: ['u2'], groups: { g1: { members: [] }}, relevantActivites: [1,3,4]}, user2: ... }
}

const getUserInitialState = () => ({
    balance: 0,
    friends: [],
    groups: {},
    relevantActivities: [],
    owes: {} // if current user is A, owes: { 'B': 100 } means A owes B a 100$ 
});

const getUserData = (username) => {
    return expenseState.userData[username];
}

const getOrAddUserData = (username) => {
    if (!expenseState.userData[username]) {
        expenseState.userData = { ...expenseState.userData, [username]: getUserInitialState() };
    }
    return expenseState.userData[username];
}

/**
 * expense obj has the following fields : 
 * name: 'Cactus Resturant'
 * splitMode: 'splitEqually'| 'transfer' | 'custom'   
 * paidBy: userWho paid,
 * paidAmount: paidAmount,
 * splitBetween: ['friend1', 'friend2' , 'friend3']
 * splitDetails: {
 *  'friend1': amount1,
 *  'friend2': amount2,
 *  'friend3': amount3,
 * }
 * @param  
 */
const addExpense = (expense) => {
    const currentActivityId = uuid();
    let { name, splitMode, paidBy, paidAmount, splitBetween, splitDetails } = expense;
    const userImpacted = [...splitBetween];

    const paidByUser = getOrAddUserData(paidBy);
    paidByUser.balance += paidAmount;

    switch (splitMode) {
        case 'splitEqually':
            splitDetails = getSplitDetails(paidAmount, splitBetween);
            break;
        case 'transfer':
            splitDetails = getSplitDetails(paidAmount, splitBetween);
            break;
        case 'custom':
        default:
            break;
    }
    expenseState = {
        ...expenseState,
        activites: {
            ...expenseState.activites,
            [currentActivityId]: {
                currentActivityId,
                timestamp: new Date(),
                name,
                paidBy,
                paidAmount,
                splitBetween,
                splitDetails
            }
        }
    };

    paidByUser.relevantActivities = dedupActivities([...paidByUser.relevantActivities, expenseState.activites[currentActivityId]]);

    userImpacted.forEach(u => {
        const user = getOrAddUserData(u);
        user.relevantActivities = dedupActivities([...user.relevantActivities, expenseState.activites[currentActivityId]]);
        if (!!splitDetails[u]) {
            user.balance += splitDetails[u];
            if (u !== paidBy) {
                user.owes = { ...user.owes, [paidBy]: (user.owes[paidBy] ?? 0) - splitDetails[u] };
                paidByUser.owes = { ...paidByUser.owes, [u]: (paidByUser.owes[u] ?? 0) + splitDetails[u] };
            }
        }
    });
}

const getSplitDetails = (paidAmount, splitBetween) => {
    const length = splitBetween.length;
    return splitBetween.reduce((runningVal, friend) => ({ ...runningVal, [friend]: -1 * paidAmount / length }), {});
}

const addFriend = (username, friendName) => {
    const userData = getOrAddUserData(username);
    userData.friends = [
        ...userData.friends,
        friendName
    ];
    const friendData = getOrAddUserData(friendName);
    friendData.friends = [
        ...friendData.friends,
        username
    ];
}

const addGroup = (groupName, members) => {
    const memberData = members.map(m => getOrAddUserData(m));
    memberData.forEach(m => {
        m.groups = {
            ...m.groups,
            [groupName]: {
                members: members
            }
        }
    });
}

const dedupActivities = (arr) => {
    return arr.filter((value, index) =>
        index === arr.findIndex((t) => (
            value.currentActivityId === t.currentActivityId
        ))
    )
}


module.exports = {
    addExpense,
    addFriend,
    addGroup,
    getUserData,
    getOrAddUserData,
}