def AB(A, B): 
    C = [] 
    for i in range(len(A)): 
        c = [] 
        for j in range(len(A[0])): 
            s = 0 
            for k in range(len(B)): 
                s += A[i][k] * B[k][j] 
                c.append(s) 
        C.append(c) 
    return C 
#Пример:
A, B = [[5,3], [2,1]], [[0,2], [4,7]] 
print(AB(A, B)) 