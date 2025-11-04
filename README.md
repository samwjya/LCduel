# LC Duel

LC Duel is a real-time coding duel platform inspired by LeetCode.  
It allows users to compete against each other by solving programming problems in real time.  
The app uses **FastAPI** for the backend, **React** for the frontend, **PostgreSQL** for data storage, and the **Judge0 API** to run code in a sandboxed environment.

---

## Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/samwjya/LCduel.git
cd LCduel

```
### 2. Set up the backend
```bash
#Create and activate a virtual environment:
python -m venv venv
source venv/bin/activate   # Mac/Linux
venv\Scripts\activate      # Windows

#Install dependencies:
pip install -r requirements.txt

#Run the FastAPI server:
uvicorn main:app --reload
```
The backend will run at http://localhost:8000

### 3. Set up the frontend
Make sure venv is activated
```bash
cd leetcode-duel-frontend
npm run dev
```
The frontend will run at http://localhost:5173

### 4. Environment Variables
Create a .env file inside the backend folder with the following content:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/lcduel
RAPIDAPI_KEY=your_rapidapi_key
```



