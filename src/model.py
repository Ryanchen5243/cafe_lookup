import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.model_selection import train_test_split
from sklearn import svm
from sklearn.metrics import accuracy_score
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score
import joblib
import os

def nlp_model():    
    raw_df = pd.read_csv("data/cafe_data.csv")
    mini_lm_model = SentenceTransformer("all-MiniLM-L6-v2")
    df = pd.concat([raw_df[raw_df['label']!=2], raw_df[raw_df['label']==2].head(50)], ignore_index=True, sort=False)
    X,y = df['review'], df['label']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    embeddings_train = mini_lm_model.encode(X_train.tolist(),show_progress_bar=True)
    embeddings_test = mini_lm_model.encode(X_test.tolist(),show_progress_bar=True)

    # SVM classifier
    svm_classifier = svm.SVC(probability=True)
    svm_classifier.fit(embeddings_train,y_train.tolist())
    pred = svm_classifier.predict(embeddings_test.tolist())
    print("SVM accuracy : ",accuracy_score(y_test, pred))
    print("SVM f1 score (macro):", f1_score(y_test, pred, average="macro"))
    print("SVM f1 score (weighted):", f1_score(y_test, pred, average="weighted"))

    # Logistic Regression classifier
    log_reg_classifier = LogisticRegression(max_iter=1000,solver='saga', n_jobs = 1).fit(embeddings_train, y_train.tolist())
    pred = log_reg_classifier.predict(embeddings_test.tolist())
    print("LR accuracy : ", accuracy_score(y_test,pred))
    print("LR f1 score (macro):", f1_score(y_test, pred, average="macro"))
    print("LR f1 score (weighted):", f1_score(y_test, pred, average="weighted"))
    path = "models/svm_classifier.pkl"
    if os.path.exists(path):
        print(f'{path} already exists')
    else:
        joblib.dump(svm_classifier, path)

if __name__ == "__main__":
    nlp_model()