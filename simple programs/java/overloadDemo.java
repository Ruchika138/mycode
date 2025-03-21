class A
{
    int x,y;
   A(int a, int b)
   {
    x = a;
    y = b;
   } 
   void display()
   {
    System.out.println("The value x and y: " + x+ " "+y);
   }
}
class B extends A
{
    int k;
    B(int a,int b,int c)
    {
        super(a,b);
        k = c;
    }
    void display(String message)
    {
        System.out.println(message + k);
    }
    }
public class overloadDemo 
{
    public static void main(String[] args)
     {
    B ob= new B(45, 35, 65);
    ob.display("The value of k is ");
    ob.display();    
    }
}