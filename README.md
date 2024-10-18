# Timetabling System

The **Timetabling System** is a decentralized platform designed to manage educational resources such as users (students, instructors, and admins), courses, instructors, classrooms, and timetables. The platform provides role-based access and facilitates the creation and management of course schedules by automatically generating timetables for classrooms and instructors.

## Features

- **User Management**: Manage users with different roles (Student, Instructor, Admin). Each user is assigned a unique ID and has attributes such as username, password, email, and role.
  - Supports creation, retrieval, and role-based operations on users.
  
- **Course Management**: Create and manage courses with details like name, duration in years, required equipment, and prerequisites.
  - View and fetch courses by name and get a list of all available courses.

- **Instructor Management**: Manage instructors, including their availability and preferred time slots.
  - View and fetch instructors by name or based on availability for a particular time slot.

- **Classroom Management**: Manage classrooms, including their capacity and available equipment.
  - View available classrooms and manage classroom capacity.

- **Timetable Management**: Create and manage timetables that link courses, instructors, and classrooms.
  - Auto-generate timetables based on available instructors, classrooms, and courses.
  - View and manage existing timetables.

## Entities

1. **User**: Represents users (students, instructors, and admins) of the system.
   - Fields: `id`, `owner`, `username`, `password`, `role`, `email`, `created_at`

2. **Course**: Represents a course with a unique ID, name, duration, and required equipment.
   - Fields: `id`, `name`, `duration_years`, `required_equipment`, `prerequisites`

3. **Instructor**: Represents an instructor, with information about availability and preferred times.
   - Fields: `id`, `name`, `availability`, `preferred_times`

4. **Classroom**: Represents a classroom with capacity and available equipment.
   - Fields: `id`, `name`, `capacity`, `equipment`

5. **Timetable**: Represents a timetable linking courses, instructors, classrooms, and time slots.
   - Fields: `id`, `course_id`, `instructor_id`, `classroom_id`, `time_slot`

## Usage

### User Management
- **Create User**: Create a new user with specified role and attributes.
- **Get User**: Retrieve a user by their ID, email, or username.
- **Change User Role**: Update the role of a user (e.g., promote a student to an admin).

### Course Management
- **Create Course**: Define a new course, including its name, duration, and required equipment.
- **Get Courses**: Fetch a list of all available courses or search by course name.

### Instructor Management
- **Create Instructor**: Add an instructor, specifying their availability and preferred times.
- **Get Available Instructors**: Find instructors based on their availability at a given time slot.

### Classroom Management
- **Create Classroom**: Define a new classroom with its name, capacity, and available equipment.
- **Get Classrooms**: Fetch a list of all available classrooms.

### Timetable Management
- **Create Timetable**: Schedule a timetable by linking courses, instructors, and classrooms.
- **Auto-generate Timetables**: Automatically generate timetables based on available resources (courses, instructors, and classrooms).
- **Get Timetables**: Retrieve all existing timetables.

## Getting Started

1. **Install Dependencies**: Ensure all necessary dependencies are installed.
   ```bash
   npm install



## Things to be explained in the course:
1. What is Ledger? More details here: https://internetcomputer.org/docs/current/developer-docs/integrations/ledger/
2. What is Internet Identity? More details here: https://internetcomputer.org/internet-identity
3. What is Principal, Identity, Address? https://internetcomputer.org/internet-identity | https://yumimarketplace.medium.com/whats-the-difference-between-principal-id-and-account-id-3c908afdc1f9
4. Canister-to-canister communication and how multi-canister development is done? https://medium.com/icp-league/explore-backend-multi-canister-development-on-ic-680064b06320

## How to deploy canisters implemented in the course

### Ledger canister
`./deploy-local-ledger.sh` - deploys a local Ledger canister. IC works differently when run locally so there is no default network token available and you have to deploy it yourself. Remember that it's not a token like ERC-20 in Ethereum, it's a native token for ICP, just deployed separately.
This canister is described in the `dfx.json`:
```
	"ledger_canister": {
  	"type": "custom",
  	"candid": "https://raw.githubusercontent.com/dfinity/ic/928caf66c35627efe407006230beee60ad38f090/rs/rosetta-api/icp_ledger/ledger.did",
  	"wasm": "https://download.dfinity.systems/ic/928caf66c35627efe407006230beee60ad38f090/canisters/ledger-canister.wasm.gz",
  	"remote": {
    	"id": {
      	"ic": "ryjl3-tyaaa-aaaaa-aaaba-cai"
    	}
  	}
	}
```
`remote.id.ic` - that is the principal of the Ledger canister and it will be available by this principal when you work with the ledger.

Also, in the scope of this script, a minter identity is created which can be used for minting tokens
for the testing purposes.
Additionally, the default identity is pre-populated with 1000_000_000_000 e8s which is equal to 10_000 * 10**8 ICP.
The decimals value for ICP is 10**8.

List identities:
`dfx identity list`

Switch to the minter identity:
`dfx identity use minter`

Transfer ICP:
`dfx ledger transfer <ADDRESS>  --memo 0 --icp 100 --fee 0`
where:
 - `--memo` is some correlation id that can be set to identify some particular transactions (we use that in the marketplace canister).
 - `--icp` is the transfer amount
 - `--fee` is the transaction fee. In this case it's 0 because we make this transfer as the minter idenity thus this transaction is of type MINT, not TRANSFER.
 - `<ADDRESS>` is the address of the recipient. To get the address from the principal, you can use the helper function from the marketplace canister - `getAddressFromPrincipal(principal: Principal)`, it can be called via the Candid UI.


### Internet identity canister

`dfx deploy internet_identity` - that is the canister that handles the authentication flow. Once it's deployed, the `js-agent` library will be talking to it to register identities. There is UI that acts as a wallet where you can select existing identities
or create a new one.

### Marketplace canister

`dfx deploy dfinity_js_backend` - deploys the marketplace canister where the business logic is implemented.
Basically, it implements functions like add, view, update, delete, and buy products + a set of helper functions.

Do not forget to run `dfx generate dfinity_js_backend` anytime you add/remove functions in the canister or when you change the signatures.
Otherwise, these changes won't be reflected in IDL's and won't work when called using the JS agent.

## Simple User Flow

1. **Register**: 
   A user registers as either a **Consumer** or a **Seller** by providing their name, email, and role.
   
2. **Seller Adds Product**:
   Once registered, a seller can add products for sale by providing the product's name, description, category, price, and stock.

3. **Consumers View Products**:
   Consumers can view a list of all available products. They can also view reviews for individual products.

4. **Bidding**:
   Consumers can place bids on products they wish to purchase. The seller can then accept or reject the bid.

5. **Checkout**:
   Once a bid is accepted, the consumer can proceed to checkout and create an order for the product.

6. **Escrow Management**:
   Upon a successful purchase, the system places funds in escrow until the product is delivered. Sellers can request payment release, and disputes can be raised if there are any issues.

7. **Dispute Management**:
   If there is a disagreement over the product, either the consumer or seller can raise a dispute. The system allows disputes to be resolved with funds allocated based on the resolution.

8. **Rating & Review**:
   After the transaction, consumers can leave reviews and rate the products, allowing other users to benefit from their feedback.

