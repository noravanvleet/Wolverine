package wolverine;

public class Spiderman {

    private final String name;
    private int health;
    private int webFluidLevel;

    public Spiderman() {
        this("Peter Parker", 100, 100);
    }

    public Spiderman(String name, int health, int webFluidLevel) {
        if (name == null || name.isBlank())
            throw new IllegalArgumentException("Name cannot be empty.");
        if (health <= 0)
            throw new IllegalArgumentException("Health must be positive.");
        if (webFluidLevel < 0)
            throw new IllegalArgumentException("Web fluid level cannot be negative.");

        this.name = name;
        this.health = health;
        this.webFluidLevel = webFluidLevel;
    }

    public String getName() {
        System.out.println("Spiderman's name is: " + name);
        return name;
    }

    public int getHealth() {
        return health;
    }

    public int getWebFluidLevel() {
        return webFluidLevel;
    }

    public boolean isAlive() {
        return health > 0;
    }

    public void shootWeb() {
        if (webFluidLevel <= 0)
            throw new IllegalStateException("Out of web fluid.");

        webFluidLevel -= 10;
    }

    public void takeDamage(int amount) {
        if (amount <= 0)
            throw new IllegalArgumentException("Damage amount must be positive.");

        health = Math.max(0, health - amount);
    }

    public String swing() {
        if (!isAlive())
            throw new IllegalStateException("Cannot swing — Spiderman is defeated.");
        if (webFluidLevel <= 0)
            throw new IllegalStateException("Cannot swing — out of web fluid.");

        shootWeb();
        return name + " swings through the city!";
    }

    public void lexLutherInterceptsWebUsingSuperGirlsDogYo() {
        System.out.println("Bark");
        webFluidLevel -= 50;
        health = webFluidLevel;
    }
}
