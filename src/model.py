import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.model_selection import train_test_split
from sklearn import svm
from sklearn.metrics import accuracy_score
from sklearn.linear_model import LogisticRegression

def nlp_model():    
    raw_df = pd.read_csv("data/cafe_data.csv")
    mini_lm_model = SentenceTransformer("all-MiniLM-L6-v2")
    # ensure three classes are equal
    df = pd.concat([raw_df[raw_df['label']!=2], raw_df[raw_df['label']==2].head(50)], ignore_index=True, sort=False)
    print(df.columns.tolist())
    print("class 0: ",df[df['label']==0].shape[0])
    print("class 1: ",df[df['label']==1].shape[0])
    print("class 2: ",df[df['label']==2].shape[0])

    # training/testing data split
    X,y = df['review'], df['label']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    embeddings_train = mini_lm_model.encode(X_train.tolist(),show_progress_bar=True)
    embeddings_test = mini_lm_model.encode(X_test.tolist(),show_progress_bar=True)

    # train a SVM classifier
    svm_classifier = svm.SVC()
    svm_classifier.fit(embeddings_train,y_train.tolist())
    # predict on test set
    pred = svm_classifier.predict(embeddings_test.tolist())
    print("SVM accuracy : ",accuracy_score(y_test, pred))

    # train a logistic regression classifier
    log_reg_classifier = LogisticRegression(max_iter=1000,solver='saga', n_jobs = 1).fit(embeddings_train, y_train.tolist())
    pred = log_reg_classifier.predict(embeddings_test.tolist())
    print("log reg accuracy : ", accuracy_score(y_test,pred))

if __name__ == "__main__":
    nlp_model()