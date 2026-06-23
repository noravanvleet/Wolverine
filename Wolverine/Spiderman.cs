namespace Wolverine;

public class Spiderman
{
    public string Name { get; }
    public int Health { get; private set; }
    public int WebFluidLevel { get; private set; }

    public bool IsAlive => Health > 0;

    public Spiderman(string name = "Peter Parker", int health = 100, int webFluidLevel = 100)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name cannot be empty.", nameof(name));
        if (health <= 0)
            throw new ArgumentException("Health must be positive.", nameof(health));
        if (webFluidLevel < 0)
            throw new ArgumentException("Web fluid level cannot be negative.", nameof(webFluidLevel));

        Name = name;
        Health = health;
        WebFluidLevel = webFluidLevel;
    }

    public void ShootWeb()
    {
        if (WebFluidLevel <= 0)
            throw new InvalidOperationException("Out of web fluid.");

        WebFluidLevel -= 10;
    }

    public void TakeDamage(int amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Damage amount must be positive.", nameof(amount));

        Health = Math.Max(0, Health - amount);
    }

    public string Swing()
    {
        if (!IsAlive)
            throw new InvalidOperationException("Cannot swing — Spiderman is defeated.");
        if (WebFluidLevel <= 0)
            throw new InvalidOperationException("Cannot swing — out of web fluid.");

        ShootWeb();
        return $"{Name} swings through the city!";
    }

    public void LexLuther_InterceptsWebUsingSuperGirlsDogYo()
    {
        Console.WriteLine("Bark");
        WebFluidLevel -= 50;
        Health = WebFluidLevel;
    }
}